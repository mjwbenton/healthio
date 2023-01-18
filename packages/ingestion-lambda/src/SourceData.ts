// To parse this data:
//
//   import { Convert, SourceData } from "./file";
//
//   const sourceData = Convert.toSourceData(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface SourceData {
    data: Data;
}

export interface Data {
    metrics:  Metric[];
    workouts: Workout[];
}

export interface Metric {
    name:  string;
    units: MetricUnits;
    data:  Datum[];
}

export interface Datum {
    date:    string;
    qty?:    number;
    source?: null;
    Min?:    number;
    Avg?:    number;
    Max?:    number;
}

export enum MetricUnits {
    CM = "cm",
    Count = "count",
    CountMin = "count/min",
    DBASPL = "dBASPL",
    DegC = "degC",
    Empty = "%",
    G = "g",
    Hr = "hr",
    Iu = "IU",
    KJ = "kJ",
    KM = "km",
    KMHr = "km/hr",
    Kg = "kg",
    L = "L",
    LMin = "L/min",
    M = "m",
    ML = "mL",
    MS = "ms",
    Mcg = "mcg",
    Mg = "mg",
    Min = "min",
    MlKgMin = "ml/(kg·min)",
    MmHg = "mmHg",
    MmolL = "mmol/L",
    S = "s",
    UnitsMS = "m/s",
}

export interface Workout {
    route:                    Route[];
    heartRateRecovery:        HeartRate[];
    elevation:                Elevation;
    distance:                 ActiveEnergy;
    totalSwimmingStrokeCount: ActiveEnergy;
    humidity:                 ActiveEnergy;
    name:                     Name;
    start:                    string;
    end:                      string;
    isIndoor:                 boolean;
    stepCadence:              ActiveEnergy;
    heartRateData:            HeartRate[];
    flightsClimbed:           ActiveEnergy;
    maxHeartRate:             ActiveEnergy;
    totalEnergy:              ActiveEnergy;
    temperature:              ActiveEnergy;
    stepCount:                ActiveEnergy;
    speed:                    ActiveEnergy;
    avgHeartRate:             ActiveEnergy;
    activeEnergy:             ActiveEnergy;
    swimCadence:              ActiveEnergy;
    intensity:                ActiveEnergy;
}

export interface ActiveEnergy {
    units: ActiveEnergyUnits;
    qty:   number;
}

export enum ActiveEnergyUnits {
    BPM = "bpm",
    Count = "count",
    DegC = "degC",
    Empty = "%",
    KJ = "kJ",
    KM = "km",
    KMHr = "km/hr",
    Met = "MET",
    SPM = "spm",
    Steps = "steps",
}

export interface Elevation {
    units:   MetricUnits;
    ascent:  number;
    descent: number;
}

export interface HeartRate {
    units: ActiveEnergyUnits;
    qty:   number;
    date:  string;
}

export enum Name {
    Cycling = "Cycling",
    FitnessGaming = "Fitness Gaming",
    FunctionalStrengthTraining = "Functional Strength Training",
    Swimming = "Swimming",
    Walking = "Walking",
}

export interface Route {
    lon:       number;
    altitude:  number;
    timestamp: string;
    lat:       number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toSourceData(json: string): SourceData {
        return cast(JSON.parse(json), r("SourceData"));
    }

    public static sourceDataToJson(value: SourceData): string {
        return JSON.stringify(uncast(value, r("SourceData")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "SourceData": o([
        { json: "data", js: "data", typ: r("Data") },
    ], false),
    "Data": o([
        { json: "metrics", js: "metrics", typ: a(r("Metric")) },
        { json: "workouts", js: "workouts", typ: a(r("Workout")) },
    ], false),
    "Metric": o([
        { json: "name", js: "name", typ: "" },
        { json: "units", js: "units", typ: r("MetricUnits") },
        { json: "data", js: "data", typ: a(r("Datum")) },
    ], false),
    "Datum": o([
        { json: "date", js: "date", typ: "" },
        { json: "qty", js: "qty", typ: u(undefined, 3.14) },
        { json: "source", js: "source", typ: u(undefined, null) },
        { json: "Min", js: "Min", typ: u(undefined, 3.14) },
        { json: "Avg", js: "Avg", typ: u(undefined, 3.14) },
        { json: "Max", js: "Max", typ: u(undefined, 3.14) },
    ], false),
    "Workout": o([
        { json: "route", js: "route", typ: a(r("Route")) },
        { json: "heartRateRecovery", js: "heartRateRecovery", typ: a(r("HeartRate")) },
        { json: "elevation", js: "elevation", typ: r("Elevation") },
        { json: "distance", js: "distance", typ: r("ActiveEnergy") },
        { json: "totalSwimmingStrokeCount", js: "totalSwimmingStrokeCount", typ: r("ActiveEnergy") },
        { json: "humidity", js: "humidity", typ: r("ActiveEnergy") },
        { json: "name", js: "name", typ: r("Name") },
        { json: "start", js: "start", typ: "" },
        { json: "end", js: "end", typ: "" },
        { json: "isIndoor", js: "isIndoor", typ: true },
        { json: "stepCadence", js: "stepCadence", typ: r("ActiveEnergy") },
        { json: "heartRateData", js: "heartRateData", typ: a(r("HeartRate")) },
        { json: "flightsClimbed", js: "flightsClimbed", typ: r("ActiveEnergy") },
        { json: "maxHeartRate", js: "maxHeartRate", typ: r("ActiveEnergy") },
        { json: "totalEnergy", js: "totalEnergy", typ: r("ActiveEnergy") },
        { json: "temperature", js: "temperature", typ: r("ActiveEnergy") },
        { json: "stepCount", js: "stepCount", typ: r("ActiveEnergy") },
        { json: "speed", js: "speed", typ: r("ActiveEnergy") },
        { json: "avgHeartRate", js: "avgHeartRate", typ: r("ActiveEnergy") },
        { json: "activeEnergy", js: "activeEnergy", typ: r("ActiveEnergy") },
        { json: "swimCadence", js: "swimCadence", typ: r("ActiveEnergy") },
        { json: "intensity", js: "intensity", typ: r("ActiveEnergy") },
    ], false),
    "ActiveEnergy": o([
        { json: "units", js: "units", typ: r("ActiveEnergyUnits") },
        { json: "qty", js: "qty", typ: 3.14 },
    ], false),
    "Elevation": o([
        { json: "units", js: "units", typ: r("MetricUnits") },
        { json: "ascent", js: "ascent", typ: 3.14 },
        { json: "descent", js: "descent", typ: 0 },
    ], false),
    "HeartRate": o([
        { json: "units", js: "units", typ: r("ActiveEnergyUnits") },
        { json: "qty", js: "qty", typ: 3.14 },
        { json: "date", js: "date", typ: "" },
    ], false),
    "Route": o([
        { json: "lon", js: "lon", typ: 3.14 },
        { json: "altitude", js: "altitude", typ: 3.14 },
        { json: "timestamp", js: "timestamp", typ: "" },
        { json: "lat", js: "lat", typ: 3.14 },
    ], false),
    "MetricUnits": [
        "cm",
        "count",
        "count/min",
        "dBASPL",
        "degC",
        "%",
        "g",
        "hr",
        "IU",
        "kJ",
        "km",
        "km/hr",
        "kg",
        "L",
        "L/min",
        "m",
        "mL",
        "ms",
        "mcg",
        "mg",
        "min",
        "ml/(kg·min)",
        "mmHg",
        "mmol/L",
        "s",
        "m/s",
    ],
    "ActiveEnergyUnits": [
        "bpm",
        "count",
        "degC",
        "%",
        "kJ",
        "km",
        "km/hr",
        "MET",
        "spm",
        "steps",
    ],
    "Name": [
        "Cycling",
        "Fitness Gaming",
        "Functional Strength Training",
        "Swimming",
        "Walking",
    ],
};
