export interface SourceData {
  data: Data;
}

export interface Data {
  metrics: Metric[];
}

export interface Metric {
  name: string;
  data: Datum[];
}

export interface Datum {
  date: string;
  qty?: number;
}
