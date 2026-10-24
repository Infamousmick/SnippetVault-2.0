import "./CustomAlert.css";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const CustomAlert = ({ text, type }) => {
  return (
    <div
      className={`settings-message ${type} d-flex align-items-center text-start gap-2`}
    >
      {(type === "danger" || type === "warning") && <AlertTriangle size={16} />}
      {type === "success" && <CheckCircle2 size={16} />}
      <span>{text}</span>
    </div>
  );
};
export default CustomAlert;
