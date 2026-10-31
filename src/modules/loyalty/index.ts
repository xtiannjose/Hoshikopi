// loyalty module: the Star ledger, Rewards, Redemptions.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export { STARS_PER_REWARD } from "./internal/rules";
export {
  adjustStars,
  balance,
  earnForOrder,
  reverseForOrder,
  starHistory,
  type AdjustResult,
} from "./internal/ledger";
