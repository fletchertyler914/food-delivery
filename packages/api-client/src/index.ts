export type { components, operations, paths } from "./generated/schema";

export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: {
    readonly path: string;
    readonly message: string;
  }[];
}
