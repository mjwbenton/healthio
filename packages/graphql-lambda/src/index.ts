import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@as-integrations/aws-lambda";
import { DateResolver } from "graphql-scalars";
import { readFileSync } from "fs";
import { QueryActivityArgs, Resolvers } from "./generated/graphql";
import { getData } from "./data";
import { getForwardedArgs, withForwardedArgs } from "./util";
import parseISO from "date-fns/parseISO";

const typeDefs = readFileSync("./schema.graphql", { encoding: "utf-8" });

const WALKING_METRIC = "walking_running_distance";
const SWIMMING_METRIC = "swimming_distance";

const resolvers: Resolvers = {
  Date: DateResolver,
  Activity: {
    swimmingDistance: async (parent) => {
      const { startDate, endDate } =
        getForwardedArgs<QueryActivityArgs>(parent);
      const data = await getData(SWIMMING_METRIC, startDate, endDate);
      return {
        m: data.total,
        km: data.total / 1000,
        days: data.days.map(({ m, date }) => ({
          m,
          date: parseISO(date),
          km: m / 1000,
        })),
      };
    },
    walkingRunningDistance: async (parent) => {
      const { startDate, endDate } =
        getForwardedArgs<QueryActivityArgs>(parent);
      const data = await getData(WALKING_METRIC, startDate, endDate);
      return {
        m: data.total,
        km: data.total / 1000,
        days: data.days.map(({ m, date }) => ({
          m,
          date: parseISO(date),
          km: m / 1000,
        })),
      };
    },
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
