type AuditLogItem = {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  operator: string;
  reason?: string;
  createdAt: string;
};

export function AuditLogList({ items = [] }: { items?: AuditLogItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
        暂无审计记录。状态变更会写入审计占位，可通过 GET /api/hub/admin/audit-logs 查询。
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            {["targetType", "targetId", "action", "operator", "reason", "createdAt"].map((title) => (
              <th key={title} className="px-3 py-2 font-medium">{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-3 py-2">{item.targetType}</td>
              <td className="px-3 py-2">{item.targetId}</td>
              <td className="px-3 py-2">{item.action}</td>
              <td className="px-3 py-2">{item.operator}</td>
              <td className="px-3 py-2">{item.reason ?? "-"}</td>
              <td className="px-3 py-2">{item.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
