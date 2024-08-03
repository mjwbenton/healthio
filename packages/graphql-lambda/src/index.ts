import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { readFileSync } from "fs";
import { Resolvers } from "./generated/graphql";
import { withForwardedArgs } from "./util";
import metricResolver from "./metricResolver";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import workoutResolver from "./workoutResolver";

const typeDefs = parse(readFileSync("./schema.graphql", { encoding: "utf-8" }));

const WALKING_METRIC = "walking_running_distance";
const SWIMMING_METRIC = "swimming_distance";

const resolvers: Resolvers = {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  Activity: {
    swimmingDistance: metricResolver(SWIMMING_METRIC),
    walkingRunningDistance: metricResolver(WALKING_METRIC),
    workouts: workoutResolver,
  },
  Query: {
    // TODO Sort out this ignore
    //@ts-ignore
    activity: async (_, args) => {
      return withForwardedArgs(args, {});
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs,
    resolvers,
  }),
});

export const handler = startServerAndCreateLambdaHandler(server);
