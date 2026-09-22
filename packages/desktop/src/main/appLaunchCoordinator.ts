interface AppLaunchGateLike {
  consume(): boolean;
}

interface RendererReadyInput {
  rendererId: number;
}

export function createAppLaunchCoordinator(appLaunchGate: AppLaunchGateLike) {
  return {
    onRendererReady({ rendererId: _rendererId }: RendererReadyInput): boolean {
      return appLaunchGate.consume();
    },
  };
}
