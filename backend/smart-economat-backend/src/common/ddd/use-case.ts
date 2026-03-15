export abstract class UseCase<Input = unknown, Output = unknown> {
  abstract execute(input: Input): Promise<Output>;
}
