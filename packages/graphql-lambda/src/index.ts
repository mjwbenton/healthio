import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { DateResolver } from "graphql-scalars";
import { readFileSync } from "fs";
import { Resolvers } from "./generated/graphql";
import { withForwardedArgs } from "./util";
import activityResolver from "./activityResolver";

const typeDefs = readFileSync("./schema.graphql", { encoding: "utf-8" });

const WALKING_METRIC = "walking_running_distance";
const SWIMMING_METRIC = "swimming_distance";

const resolvers: Resolvers = {
  Date: DateResolver,
  Activity: {
    swimmingDistance: activityResolver(SWIMMING_METRIC),
    walkingRunningDistance: activityResolver(WALKING_METRIC),
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
  typeDefs,
  resolvers,
});

export const handler = startServerAndCreateLambdaHandler(server);
