/* ------------------------------------------------------------------
   App-wide antd entry point (Vite aliases `import … from "antd"` here).
   Everything is re-exported unchanged, except Form, which gets:
     • scroll to the first invalid field (smooth, centred) on submit
     • a toast listing what needs fixing
   The same happens when code calls form.validateFields() itself
   (e.g. a Modal's onOk).
   ------------------------------------------------------------------ */
import React from "react";
import { Form as AntForm } from "antd/es";
import { showFormErrors, SCROLL_OPTIONS } from "./feedback";

export * from "antd/es";

const useForm = (existing) => {
  const [inst] = AntForm.useForm(existing);
  if (inst && !inst.__wheellolFeedback) {
    const original = inst.validateFields;
    inst.validateFields = (...args) =>
      original(...args).catch((err) => {
        // only for full-form validation, not single-field checks
        const partial = Array.isArray(args[0]);
        if (!partial && err?.errorFields?.length) {
          showFormErrors(err.errorFields);
          try {
            inst.scrollToField(err.errorFields[0].name, SCROLL_OPTIONS);
          } catch (e) {
            /* field may be unmounted */
          }
        }
        throw err;
      });
    inst.__wheellolFeedback = true;
  }
  return [inst];
};

const Form = React.forwardRef(({ onFinishFailed, scrollToFirstError, ...rest }, ref) => (
  <AntForm
    ref={ref}
    scrollToFirstError={scrollToFirstError ?? SCROLL_OPTIONS}
    onFinishFailed={(info) => {
      showFormErrors(info?.errorFields);
      onFinishFailed && onFinishFailed(info);
    }}
    {...rest}
  />
));
Form.displayName = "Form";
Form.Item = AntForm.Item;
Form.List = AntForm.List;
Form.ErrorList = AntForm.ErrorList;
Form.Provider = AntForm.Provider;
Form.useFormInstance = AntForm.useFormInstance;
Form.useWatch = AntForm.useWatch;
Form.useForm = useForm;
Form.create = AntForm.create;

export { Form };
