import { AdminBoundaryRow } from "../../utils/adminBoundaries";

interface Props {
  rows: AdminBoundaryRow[];
}

const AdministrativeBoundaryTooltip = ({ rows }: Props) => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="admin-boundary-content">
      <div className="admin-boundary-header">Administrative boundaries</div>
      <hr className="admin-boundary-divider" />
      {rows.map((r) => (
        <div className="admin-boundary-item" key={r.label}>
          <div className="admin-boundary-item-header">{r.label}</div>

          <div className="admin-boundary-item-content">
            <div>{r.value}</div>
            <div
              className="admin-boundary-item-colour"
              style={{ backgroundColor: r.colour }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdministrativeBoundaryTooltip;
