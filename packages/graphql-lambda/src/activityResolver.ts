import parseISO from "date-fns/parseISO";
import getMonth from "date-fns/getMonth";
import getYear from "date-fns/getYear";
import { getData } from "./data";
import { DistanceMonth, QueryActivityArgs } from "./generated/graphql";
import { getForwardedArgs } from "./util";

export default function activityResolver(metric: string) {
  return async (parent: unknown) => {
    const { startDate, endDate } = getForwardedArgs<QueryActivityArgs>(parent);
    const data = await getData(metric, startDate, endDate);
    return {
      m: data.total,
      km: data.total / 1000,
      days: data.days.map(({ m, date }) => ({
        m,
        date: parseISO(date),
        km: m / 1000,
      })),
      months: data.days.reduce<DistanceMonth[]>((acc, { m, date }) => {
        const dateObj = parseISO(date);
        const month = getMonth(dateObj) + 1;
        const year = getYear(dateObj);
        const currentMonth = acc[acc.length - 1];
        if (
          currentMonth &&
          currentMonth.year === year &&
          currentMonth.month === month
        ) {
          currentMonth.m += m;
          currentMonth.km = currentMonth.m / 1000;
        } else {
          acc.push({
            m,
            month,
            year,
            km: m / 1000,
          });
        }
        return acc;
      }, []),
    };
  };
}
