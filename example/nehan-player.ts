import { NehanPlayer } from '../dist';

// force export NehanPlayer to global namespace.
if (!(window as any)["NehanPlayer"]) {
  (window as any)["NehanPlayer"] = NehanPlayer;
}
