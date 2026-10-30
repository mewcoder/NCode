import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it } from "vitest";
import {
  writeBundledOfficialMarketplacePartitionSync,
  writeCdnOfficialMarketplacePartitionSync,
  updateMarketplace,
  ensureDefaultPluginMarketplaces,
  addMarketplace,
  installMarketplacePlugin,
  loadMarketplaceManifestSync,
} from "../src/plugins/index.js";

describe("ZCode official marketplace partitions", () => {
  const cleanups: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanups.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  async function makeStorageRoot(): Promise<string> {
    const storageRoot = await mkdtemp(join(tmpdir(), "zcode-official-marketplace-"));
    cleanups.push(storageRoot);
    return storageRoot;
  }

  it("registers CDN by default and migrates only exact previous defaults once", async () => {
    const storageRoot = await makeStorageRoot();
    expect(
      ensureDefaultPluginMarketplaces(storageRoot).find(
        (record) => record.id === "zcode-plugins-official",
      )?.source,
    ).toEqual({
      source: "url",
      url: "https://cdn-zcode.z.ai/zcode/official-plugin/marketplace.json",
    });
    expect(ensureDefaultPluginMarketplaces(storageRoot).map((record) => record.id)).toEqual([
      "zcode-plugins-official",
    ]);
    const record = {
      id: "zcode-plugins-official",
      name: "zcode-plugins-official",
      source: {
        source: "url",
        url: "https://zai-org.github.io/zcode-plugins/marketplace.json",
      },
      addedAt: "2026-01-01T00:00:00.000Z",
      lastUpdated: "2026-01-02T00:00:00.000Z",
      lastRefreshFailure: {
        code: "plugin_marketplace_invalid",
        failedAt: "2026-01-02T00:00:00.000Z",
        message: "old source failed",
      },
      pluginCount: 12,
    };
    const knownPath = join(storageRoot, "known_marketplaces.json");
    await writeFile(knownPath, JSON.stringify({ version: 1, marketplaces: [record] }));
    const migrated = ensureDefaultPluginMarketplaces(storageRoot);
    expect(migrated.find((item) => item.id === record.id)).toEqual({
      id: record.id,
      name: record.name,
      addedAt: record.addedAt,
      pluginCount: 12,
      source: {
        source: "url",
        url: "https://cdn-zcode.z.ai/zcode/official-plugin/marketplace.json",
      },
    });
    const firstMtime = (await stat(knownPath)).mtimeMs;
    expect(ensureDefaultPluginMarketplaces(storageRoot)).toEqual(migrated);
    expect((await stat(knownPath)).mtimeMs).toBe(firstMtime);

    await writeFile(
      knownPath,
      JSON.stringify({
        version: 1,
        marketplaces: [{ ...record, source: { source: "github", repo: "zai-org/zcode-plugins" } }],
      }),
    );
    expect(ensureDefaultPluginMarketplaces(storageRoot)[0]?.source).toEqual({
      source: "url",
      url: "https://cdn-zcode.z.ai/zcode/official-plugin/marketplace.json",
    });
    for (const source of [
      { source: "github", repo: "zai-org/zcode-plugins", ref: "main" },
      { source: "github", repo: "zai-org/zcode-plugins", path: "custom.json" },
      { source: "github", repo: "zai-org/zcode-plugins", sparsePaths: ["plugins"] },
      { source: "url", url: record.source.url, headers: { "X-Custom": "preserve" } },
    ]) {
      const customRecord = { ...record, source };
      await writeFile(knownPath, JSON.stringify({ version: 1, marketplaces: [customRecord] }));
      expect(ensureDefaultPluginMarketplaces(storageRoot)[0]).toEqual(customRecord);
    }
    const custom = {
      ...record,
      source: { source: "directory", path: join(storageRoot, "custom") },
    };
    const personal = { ...record, id: "personal-market", name: "personal-market" };
    await writeFile(knownPath, JSON.stringify({ version: 1, marketplaces: [custom, personal] }));
    expect(ensureDefaultPluginMarketplaces(storageRoot)).toEqual(
      expect.arrayContaining([custom, personal]),
    );
  });

  it("rebases official cached CDN assets but preserves personal and external images", async () => {
    const storageRoot = await makeStorageRoot();
    const cdn = "https://cdn-zcode.z.ai/zcode/official-plugin/assets/";
    const plugins = [
      {
        name: "panel",
        source: "filesystem",
        icon: cdn + "panel/icon.png",
        heroImage: "https://example.com/hero.png",
      },
    ];
    writeCdnOfficialMarketplacePartitionSync({
      storageRoot,
      manifest: { name: "zcode-plugins-official", plugins },
    });
    const official = loadMarketplaceManifestSync(storageRoot, "zcode-plugins-official")!
      .plugins[0]!;
    expect(official.listing?.icon).toBe(
      "https://zai-org.github.io/zcode-plugins/assets/panel/icon.png",
    );
    expect(official.listing?.heroImage).toBe("https://example.com/hero.png");
    await addMarketplace({
      storageRoot,
      source: { source: "settings", marketplace: { name: "personal", plugins } },
    });
    expect(loadMarketplaceManifestSync(storageRoot, "personal")!.plugins[0]!.listing?.icon).toBe(
      cdn + "panel/icon.png",
    );
  });

  it("keeps official partitions across directory refreshes, installation and bundled reseeding", async () => {
    const storageRoot = await makeStorageRoot();
    const sourceRoot = await makeStorageRoot();
    const pluginRoot = join(sourceRoot, "plugins", "remote");
    await mkdir(join(pluginRoot, ".claude-plugin"), { recursive: true });
    await writeFile(
      join(pluginRoot, ".claude-plugin", "plugin.json"),
      JSON.stringify({ name: "remote", version: "1.0.0" }),
    );
    await writeFile(join(pluginRoot, "README.md"), "remote plugin contents");
    await writeFile(
      join(sourceRoot, "marketplace.json"),
      JSON.stringify({
        name: "zcode-plugins-official",
        plugins: [{ name: "remote", source: "./plugins/remote", version: "1.0.0" }],
      }),
    );
    const bundled = {
      name: "zcode-plugins-official",
      plugins: [{ name: "bundled", source: "filesystem", version: "1.0.0" }],
    };
    writeBundledOfficialMarketplacePartitionSync({ manifest: bundled, storageRoot });
    // 仓库内容不能替换应用持有的内置分片。
    await writeFile(
      join(sourceRoot, "bundled-marketplace.json"),
      JSON.stringify({ version: 1, manifest: { name: "zcode-plugins-official", plugins: [] } }),
    );
    await addMarketplace({
      storageRoot,
      source: { source: "directory", path: sourceRoot },
      trustedId: "zcode-plugins-official",
    });
    const installed = await installMarketplacePlugin({
      storageRoot,
      marketplace: "zcode-plugins-official",
      name: "remote",
      scope: "user",
    });
    expect(
      await readFile(join(installed.installed[0]?.installPath ?? "", "README.md"), "utf8"),
    ).toBe("remote plugin contents");
    const [updated] = await updateMarketplace({
      storageRoot,
      marketplace: "zcode-plugins-official",
    });
    expect(updated?.pluginCount).toBe(2);
    writeBundledOfficialMarketplacePartitionSync({ manifest: bundled, storageRoot });
    const marketplaceRoot = join(storageRoot, "marketplaces", "zcode-plugins-official");
    const manifest = JSON.parse(
      await readFile(join(marketplaceRoot, "marketplace.json"), "utf8"),
    ) as { plugins: Array<{ name: string }> };
    expect(manifest.plugins.map((plugin) => plugin.name)).toEqual(["remote", "bundled"]);
    expect(
      JSON.parse(await readFile(join(marketplaceRoot, "bundled-marketplace.json"), "utf8")),
    ).toMatchObject({ manifest: bundled });
    expect(
      JSON.parse(await readFile(join(marketplaceRoot, "cdn-marketplace.json"), "utf8")),
    ).toMatchObject({ plugins: [{ name: "remote" }] });
  });

  it("merges bundled and CDN entries under one marketplace with CDN entries taking precedence", async () => {
    const storageRoot = await makeStorageRoot();

    writeBundledOfficialMarketplacePartitionSync({
      manifest: {
        name: "zcode-plugins-official",
        plugins: [
          { name: "shared", source: "filesystem", version: "1.0.0" },
          { name: "bundled-only", source: "filesystem", version: "1.0.0" },
        ],
        version: 1,
      },
      storageRoot,
    });
    writeCdnOfficialMarketplacePartitionSync({
      manifest: {
        name: "zcode-plugins-official",
        featured: ["remote"],
        plugins: [
          { name: "shared", source: { source: "url", type: "zip" }, version: "9.0.0" },
          { name: "remote", source: { source: "url", type: "zip" }, version: "2.0.0" },
        ],
      },
      storageRoot,
    });

    const merged = JSON.parse(
      await readFile(
        join(storageRoot, "marketplaces", "zcode-plugins-official", "marketplace.json"),
        "utf8",
      ),
    ) as { featured?: string[]; name: string; plugins: Array<Record<string, unknown>> };
    expect(merged.name).toBe("zcode-plugins-official");
    expect(merged.featured).toEqual(["remote"]);
    expect(merged.plugins.map((plugin) => plugin.name)).toEqual([
      "shared",
      "remote",
      "bundled-only",
    ]);
    expect(merged.plugins[0]).toMatchObject({
      source: { source: "url", type: "zip" },
      version: "9.0.0",
    });
  });

  it("preserves the CDN partition when the application reseeds bundled plugins", async () => {
    const storageRoot = await makeStorageRoot();

    writeCdnOfficialMarketplacePartitionSync({
      manifest: {
        name: "zcode-plugins-official",
        plugins: [{ name: "remote", source: { source: "url", type: "zip" } }],
      },
      storageRoot,
    });
    writeBundledOfficialMarketplacePartitionSync({
      manifest: {
        name: "zcode-plugins-official",
        plugins: [{ name: "bundled-v2", source: "sea", version: "2.0.0" }],
        version: 1,
      },
      storageRoot,
    });

    const merged = JSON.parse(
      await readFile(
        join(storageRoot, "marketplaces", "zcode-plugins-official", "marketplace.json"),
        "utf8",
      ),
    ) as { plugins: Array<{ name: string }> };
    expect(merged.plugins.map((plugin) => plugin.name)).toEqual(["remote", "bundled-v2"]);
  });

  it("does not rewrite unchanged official marketplace files", async () => {
    const storageRoot = await makeStorageRoot();
    const bundledManifest = {
      name: "zcode-plugins-official",
      plugins: [{ name: "bundled", source: "filesystem", version: "1.0.0" }],
    };
    const cdnManifest = {
      name: "zcode-plugins-official",
      plugins: [{ name: "remote", source: { source: "url", type: "zip" } }],
    };
    const marketplaceRoot = join(storageRoot, "marketplaces", "zcode-plugins-official");

    writeBundledOfficialMarketplacePartitionSync({
      manifest: bundledManifest,
      storageRoot,
    });
    writeCdnOfficialMarketplacePartitionSync({
      manifest: cdnManifest,
      storageRoot,
    });
    const paths = [
      join(marketplaceRoot, "bundled-marketplace.json"),
      join(marketplaceRoot, "cdn-marketplace.json"),
      join(marketplaceRoot, "marketplace.json"),
    ];
    const firstMtimes = await Promise.all(paths.map(async (path) => (await stat(path)).mtimeMs));
    await delay(30);

    writeBundledOfficialMarketplacePartitionSync({
      manifest: bundledManifest,
      storageRoot,
    });
    writeCdnOfficialMarketplacePartitionSync({
      manifest: cdnManifest,
      storageRoot,
    });

    expect(await Promise.all(paths.map(async (path) => (await stat(path)).mtimeMs))).toEqual(
      firstMtimes,
    );
  });

  it("rejects the retired CDN marketplace id instead of creating a compatibility alias", async () => {
    const storageRoot = await makeStorageRoot();

    expect(() =>
      writeCdnOfficialMarketplacePartitionSync({
        manifest: { name: "zcode-plugins", plugins: [] },
        storageRoot,
      }),
    ).toThrow("Official marketplace manifest must be named zcode-plugins-official");
  });

  it("refreshes the registered official source and returns the merged plugin count", async () => {
    const storageRoot = await makeStorageRoot();
    writeBundledOfficialMarketplacePartitionSync({
      manifest: {
        name: "zcode-plugins-official",
        plugins: [{ name: "bundled", source: "filesystem" }],
      },
      storageRoot,
    });

    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          name: "zcode-plugins-official",
          plugins: [{ name: "remote", source: { source: "url", type: "zip" } }],
        }),
      );
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("test server address missing");
      await writeFile(
        join(storageRoot, "known_marketplaces.json"),
        JSON.stringify({
          version: 1,
          marketplaces: [
            {
              id: "zcode-plugins-official",
              source: { source: "url", url: `http://127.0.0.1:${address.port}/marketplace.json` },
              name: "zcode-plugins-official",
              addedAt: "2026-01-01T00:00:00.000Z",
              pluginCount: 1,
            },
          ],
        }),
      );

      const [updated] = await updateMarketplace({
        marketplace: "zcode-plugins-official",
        storageRoot,
      });
      expect(updated).toMatchObject({
        id: "zcode-plugins-official",
        pluginCount: 2,
      });

      const merged = JSON.parse(
        await readFile(
          join(storageRoot, "marketplaces", "zcode-plugins-official", "marketplace.json"),
          "utf8",
        ),
      ) as { plugins: Array<{ name: string }> };
      expect(merged.plugins.map((plugin) => plugin.name)).toEqual(["remote", "bundled"]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
