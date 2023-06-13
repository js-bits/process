import type Process from './index';

export type Input = { [key: string]: unknown } & { then?: void };

export type Output = { [key: string]: unknown } & { then?: void };

export type OperationResult = Output | typeof Process.exit | void | undefined;

export type FunctionStep = (input?: Input) => OperationResult | Promise<OperationResult>;

export type Operation = Process<OperationResult> | Promise<OperationResult> | FunctionStep;
