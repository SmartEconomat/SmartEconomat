declare module "selfsigned" {
  export interface SelfSignedAttribute {
    name: string;
    value: string;
  }

  export interface SelfSignedExtension {
    name: string;
    altNames?: Array<{ type: 2; value: string } | { type: 7; ip: string }>;
    cA?: boolean;
    keyCertSign?: boolean;
    digitalSignature?: boolean;
    nonRepudiation?: boolean;
    keyEncipherment?: boolean;
    dataEncipherment?: boolean;
    serverAuth?: boolean;
    clientAuth?: boolean;
    codeSigning?: boolean;
    emailProtection?: boolean;
    timeStamping?: boolean;
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
