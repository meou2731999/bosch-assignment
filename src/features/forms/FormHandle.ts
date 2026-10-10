export interface FormHandle {
  submission: unknown;
  submit: (external?: boolean, options?: { state: string }) => Promise<unknown>;
}
