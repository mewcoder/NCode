import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  WorkerPoolContext,
  useWorkerPool,
  type WorkerInitializationRenderOptions,
} from "@pierre/diffs/react";
import {
  getOrCreateWorkerPoolSingleton,
  terminateWorkerPoolSingleton,
} from "@pierre/diffs/worker";
import { createDiffsWorkerHighlighterOptions } from "@/lib/diffsHighlighterEngine.js";
import { logger } from "@/logger.js";
import { DEFAULT_CODE_PREVIEW_SETTINGS } from "@/store/index.js";
import { useZCodeStore } from "@/store/StoreProvider.js";

const DiffsWorkerPoolActivationContext = createContext<(() => void) | null>(null);

export function DiffsWorkerPoolConsumer({ children }: { children: ReactNode }) {
  const request = useContext(DiffsWorkerPoolActivationContext);
  const workerPool = useWorkerPool();

  useEffect(() => {
    if (request && !workerPool) {
      request();
    }
  }, [request, workerPool]);

  return !request || workerPool ? <>{children}</> : null;
}

function createDiffsWorker(): Worker {
  return new Worker(new URL("../workers/diffs.worker.ts", import.meta.url), {
    type: "module",
    name: "zcode-diffs-worker",
  });
}

function resolveWorkerPoolSize(): number {
  if (typeof navigator === "undefined") {
    return 2;
  }

  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (!Number.isFinite(hardwareConcurrency) || hardwareConcurrency <= 0) {
    return 2;
  }

  return Math.max(1, Math.min(4, Math.floor(hardwareConcurrency / 2)));
}

function WorkerRenderOptionsSync({
  highlighterOptions,
}: {
  highlighterOptions: WorkerInitializationRenderOptions;
}) {
  const workerPool = useWorkerPool();

  useEffect(() => {
    if (!workerPool) {
      return;
    }

    void workerPool
      .setRenderOptions({
        theme: highlighterOptions.theme,
        lineDiffType: highlighterOptions.lineDiffType,
        maxLineDiffLength: highlighterOptions.maxLineDiffLength,
        tokenizeMaxLineLength: highlighterOptions.tokenizeMaxLineLength,
        useTokenTransformer: highlighterOptions.useTokenTransformer,
      })
      .catch((error: unknown) => {
        logger.warn("[DiffsWorkerPoolProvider] 同步渲染参数失败", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, [highlighterOptions, workerPool]);

  return null;
}

export function DiffsWorkerPoolProvider({ children }: { children: ReactNode }) {
  const codePreviewSettings = useZCodeStore(
    (state) => state.codePreviewSettings ?? DEFAULT_CODE_PREVIEW_SETTINGS,
  );

  const highlighterOptions = useMemo<WorkerInitializationRenderOptions>(
    () =>
      createDiffsWorkerHighlighterOptions({
        lightTheme: codePreviewSettings.lightTheme,
        darkTheme: codePreviewSettings.darkTheme,
      }),
    [codePreviewSettings.darkTheme, codePreviewSettings.lightTheme],
  );

  const poolSize = useMemo(() => resolveWorkerPoolSize(), []);
  const canUseWorkerPool = typeof window !== "undefined" && typeof Worker !== "undefined";
  const [workerPoolRequested, setWorkerPoolRequested] = useState(false);
  const [workerPool, setWorkerPool] = useState<
    ReturnType<typeof getOrCreateWorkerPoolSingleton> | undefined
  >();
  const workerPoolRef = useRef<ReturnType<typeof getOrCreateWorkerPoolSingleton> | null>(null);
  const requestWorkerPool = useCallback(() => setWorkerPoolRequested(true), []);

  useEffect(() => {
    if (!canUseWorkerPool || !workerPoolRequested || workerPoolRef.current) {
      return;
    }

    const manager = getOrCreateWorkerPoolSingleton({
      poolOptions: {
        workerFactory: createDiffsWorker,
        poolSize,
      },
      highlighterOptions,
    });
    workerPoolRef.current = manager;
    setWorkerPool(manager);
  }, [canUseWorkerPool, highlighterOptions, poolSize, workerPoolRequested]);

  useEffect(
    () => () => {
      if (workerPoolRef.current) {
        terminateWorkerPoolSingleton();
        workerPoolRef.current = null;
      }
    },
    [],
  );

  return (
    <DiffsWorkerPoolActivationContext.Provider
      value={canUseWorkerPool ? requestWorkerPool : null}
    >
      <WorkerPoolContext.Provider value={workerPool}>
        <WorkerRenderOptionsSync highlighterOptions={highlighterOptions} />
        {children}
      </WorkerPoolContext.Provider>
    </DiffsWorkerPoolActivationContext.Provider>
  );
}
