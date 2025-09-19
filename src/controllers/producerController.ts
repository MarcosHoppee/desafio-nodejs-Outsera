import { FastifyReply, FastifyRequest } from "fastify";
import { knex } from "../database/knex-config-db";

interface Interval {
  producer: string;
  interval: number;
  previousWin: number;
  followingWin: number;
}

interface IntervalsResponse {
  min: Interval[];
  max: Interval[];
}

export async function getProducerIntervals(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result: IntervalsResponse = await findProducerIntervals();
    return reply.status(200).send(result);
  } catch (error) {
    console.error("Error fetching ranges:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

async function findProducerIntervals(): Promise<IntervalsResponse> {
  const rows: Interval[] = await knex
    .select(
      "producer",
      "year as previousWin",
      knex.raw("LEAD(year) OVER (PARTITION BY producer ORDER BY year) as followingWin"),
      knex.raw("LEAD(year) OVER (PARTITION BY producer ORDER BY year) - year as interval")
    )
    .from("producerMovies")
    .where("winner", true);

  const intervals = rows.filter(r => r.followingWin !== null) as Interval[];

  if (intervals.length === 0) {
    return { min: [], max: [] };
  }

  const minInterval = Math.min(...intervals.map(i => i.interval));
  const maxInterval = Math.max(...intervals.map(i => i.interval));

  const min = intervals.filter(i => i.interval === minInterval);
  const max = intervals.filter(i => i.interval === maxInterval);

  return { min, max };
}
