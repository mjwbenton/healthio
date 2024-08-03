import { cleanEnv, str } from "envalid";

export const { DATA_TABLE, WORKOUT_TABLE } = cleanEnv(process.env, {
  DATA_TABLE: str(),
  WORKOUT_TABLE: str(),
});
