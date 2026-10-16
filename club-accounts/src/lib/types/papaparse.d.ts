declare module "papaparse" {
  export interface UnparseConfig {
    quotes?: boolean | boolean[] | ((value: any) => boolean);
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | "greedy";
    columns?: string[];
  }

  export function unparse(
    data: Array<Record<string, unknown>> | any[][] | { fields: string[]; data: any[] },
    config?: UnparseConfig
  ): string;

  export function parse<T = any>(
    fileOrString: any,
    config?: any
  ): {
    data: T[];
    errors: any[];
    meta: any;
  };

  const papa: {
    unparse: typeof unparse;
    parse: typeof parse;
  };

  export default papa;
}
