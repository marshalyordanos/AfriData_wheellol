// Contract section on the booking request page (/dash/requests/:id).
// If the booking has no contract yet, the admin is asked to select one.
import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Modal } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  LinkOutlined,
  MoreOutlined,
  PlusOutlined,
  PrinterOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { FormSection, StatusPill } from "../../components/modern/ModernUI";
import ContractApi, { CONTRACT_STATUS } from "./contractApi";
import PrepareContractDrawer, { ShareLinks } from "./PrepareContractDrawer";
import { printContract } from "./printContract";
import "./contracts.css";

const PROMPT_FOR = ["PENDING", "UNDER_NEGOTIATION", "APPROVED"];
const promptKey = (id) => `wl-contract-prompted-${id}`;

const Steps = ({ c }) => {
  const declined = c.status === "DECLINED";
  const steps = [
    { key: "draft", label: "Prepared", at: c.createdAt, done: true },
    { key: "sent", label: "Sent", at: c.sentAt, done: !!c.sentAt },
    { key: "viewed", label: "Opened", at: c.viewedAt, done: !!c.viewedAt || c.status === "SIGNED" },
    { key: "signed", label: declined ? "Declined" : "Signed", at: declined ? c.declinedAt : c.signedAt, done: c.status === "SIGNED", bad: declined },
  ];
  const nowIdx = steps.findIndex((s) => !s.done);
  return (
    <div className="ct-steps">
      {steps.map((s, i) => (
        <div key={s.key} className={`ct-step ${s.bad ? "is-bad" : s.done ? "is-done" : i === nowIdx ? "is-now" : ""}`}>
          <span className="d">{s.bad ? <CloseOutlined /> : s.done ? <CheckOutlined /> : i + 1}</span>
          <b>{s.label}</b>
          <span>{s.at ? dayjs(s.at).format("DD MMM, HH:mm") : "—"}</span>
        </div>
      ))}
    </div>
  );
};

const ContractPanel = ({ request, num, onChanged }) => {
  const [drawer, setDrawer] = useState(null); // { contractId | null }
  const [linkOpen, setLinkOpen] = useState(false);
  const contracts = request?.contracts || [];
  const current = contracts.find((c) => c.status !== "VOID") || null;
  const old = contracts.filter((c) => c !== current);
  const prompted = useRef(false);
  // The contract carries the agreed price, so the agreement (step 1) comes first
  const hasAgreement = request?.totalPrice > 0;

  // First time an admin opens a booking with an agreement but no contract: ask them to select one
  useEffect(() => {
    if (!request || prompted.current || !hasAgreement) return;
    prompted.current = true;
    if (current || !PROMPT_FOR.includes(request.status)) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(promptKey(request.id)) === "1";
      sessionStorage.setItem(promptKey(request.id), "1");
    } catch {
      // storage blocked: just ask
    }
    if (!seen) setDrawer({ contractId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, hasAgreement]);

  const printCurrent = async () => {
    try {
      const c = await ContractApi.get(current.id);
      printContract(c.previewHtml || c.html || "", `${c.contractNo} ${request.contactName}`);
    } catch {
      // toast handled by api interceptor
    }
  };

  const st = current ? CONTRACT_STATUS[current.status] : null;
  const canPrint = current && current.status !== "DRAFT";

  return (
    <FormSection
      num={num}
      title="Contract"
      subtitle="The agreement the customer reviews and signs online"
      extra={current ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : null}
    >
      {!current ? (
        <div className="ct-callout">
          <span className="ic">
            <FileTextOutlined />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>No contract for this booking yet</b>
            <span className="ct-muted ct-small">
              {hasAgreement
                ? "Select a contract, check the details filled from the booking and send it to the customer to sign."
                : "Set the agreement (step 1) first. The contract carries the agreed price."}
            </span>
          </div>
          {request.status !== "CANCELLED" && (
            <Button type="primary" icon={<PlusOutlined />} disabled={!hasAgreement} onClick={() => setDrawer({ contractId: null })}>
              Select contract
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{current.title}</div>
              <div className="ct-muted ct-small">{current.contractNo}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {current.status === "DRAFT" && (
                <Button type="primary" icon={<SendOutlined />} onClick={() => setDrawer({ contractId: current.id })}>
                  Finish & send
                </Button>
              )}
              {current.status === "DECLINED" && (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setDrawer({ contractId: current.id })}>
                  Update & re-send
                </Button>
              )}
              {["SENT", "VIEWED", "SIGNED"].includes(current.status) && (
                <Button icon={<FileProtectOutlined />} onClick={() => setDrawer({ contractId: current.id })}>
                  Open
                </Button>
              )}
              {["SENT", "VIEWED"].includes(current.status) && (
                <Button icon={<LinkOutlined />} onClick={() => setLinkOpen(true)}>
                  Share link
                </Button>
              )}
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    { key: "open", icon: <EditOutlined />, label: current.status === "SIGNED" ? "View contract" : "Edit contract" },
                    canPrint && { key: "print", icon: <PrinterOutlined />, label: "Print / PDF" },
                    { type: "divider" },
                    request.status !== "CANCELLED" && { key: "new", icon: <PlusOutlined />, label: "Use a different contract" },
                  ].filter(Boolean),
                  onClick: ({ key }) => {
                    if (key === "open") setDrawer({ contractId: current.id });
                    if (key === "print") printCurrent();
                    if (key === "new")
                      Modal.confirm({
                        title: "Prepare a different contract?",
                        content:
                          current.status === "DRAFT"
                            ? "A new draft is created. The current draft stays until you delete it or send the new one."
                            : "When you send the new contract, the current one is voided and can no longer be signed.",
                        okText: "Choose contract",
                        onOk: () => setDrawer({ contractId: null }),
                      });
                  },
                }}
              >
                <Button icon={<MoreOutlined />} aria-label="More contract actions" />
              </Dropdown>
            </div>
          </div>
          {current.status !== "DRAFT" && <Steps c={current} />}
          {current.status === "DRAFT" && (
            <div className="ct-muted ct-small">Draft prepared {dayjs(current.createdAt).format("DD MMM YYYY, HH:mm")} — not sent yet.</div>
          )}
          {current.status === "SIGNED" && (
            <div className="ct-muted ct-small">Signed by {current.signerName}. The signed copy is stored with the booking.</div>
          )}
          {old.length > 0 && (
            <div className="ct-hist">
              <div className="ct-muted ct-small" style={{ fontWeight: 600 }}>
                Earlier contracts
              </div>
              {old.map((c) => (
                <div key={c.id} className="ct-hist-row">
                  <span>
                    {c.contractNo} · {c.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill tone={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</StatusPill>
                    <Button size="small" type="text" onClick={() => setDrawer({ contractId: c.id })}>
                      View
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PrepareContractDrawer
        open={!!drawer}
        contractId={drawer?.contractId || null}
        request={request}
        onClose={() => setDrawer(null)}
        onChanged={onChanged}
      />
      <Modal open={linkOpen} onCancel={() => setLinkOpen(false)} footer={null} title="Send the contract link">
        {current && <ShareLinks request={request} contract={current} />}
        <p className="ct-muted ct-small" style={{ marginBottom: 0, marginTop: 12 }}>
          The link is private to this customer. Anyone with it can read and sign the contract.
        </p>
      </Modal>
    </FormSection>
  );
};

export default ContractPanel;
