declare module "selfsigned" {
  export interface SelfSignedAttribute {
    name: string;
    value: string;
  }

  export interface SelfSignedExtension {
    name: string;
    altNames?: Array<
      | { type: 2; value: string }
      | { type: 7; ip: string }
    >;
    cA?: boolean;
    keyUsage?: boolean[];
    extendedKeyUsage?: boolean[];
  }

  export interface SelfSignedOptions {
    algorithm?: string;
    days?: number;
    keySize?: number;
    extensions?: SelfSignedExtension[];
  }

  export interface SelfSignedResult {
    private: string;
    public: string;
    cert: string;
    fingerprint: string;
  }

  export function generate(
    attrs: SelfSignedAttribute[],
    options?: SelfSignedOptions,
  ): SelfSignedResult;

  const selfsigned: {
    generate: typeof generate;
  };

  export default selfsigned;
}