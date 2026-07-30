import { useState, useEffect } from 'react';
import { getOrgChart } from '../api/employees';

// Converts the flat list of employees the API returns into an actual
// tree structure, based on each employee's `manager` field. This is
// the core logic of this whole feature - everything else is just
// rendering whatever tree comes out of this function.
const buildTree = (employees) => {
  // A lookup map from employee _id -> that employee's object, with an
  // empty `children` array added to each one upfront. Building this
  // map first means we can attach children in a single pass below,
  // rather than repeatedly searching the whole list for each employee's
  // manager (which would be much slower for a large company).
  const byId = {};
  employees.forEach((emp) => {
    byId[emp._id] = { ...emp, children: [] };
  });

  const roots = [];

  employees.forEach((emp) => {
    const node = byId[emp._id];
    if (emp.manager && byId[emp.manager]) {
      // This employee has a manager who's also in our list - attach
      // this node as a child of that manager's node.
      byId[emp.manager].children.push(node);
    } else {
      // No manager, or their manager isn't in the active employee list
      // (e.g. manager left the company) - treat as a top-level root.
      roots.push(node);
    }
  });

  return roots;
};

export default function OrgChart() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getOrgChart();
        setTree(buildTree(data.employees));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load org chart');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Org Chart</h1>

      {tree.length === 0 ? (
        <p className="text-slate-400">No employee data available.</p>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-max justify-center gap-8">
            {tree.map((node) => (
              <OrgNode key={node._id} node={node} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Renders one employee "card", then recursively renders their direct
// reports underneath, connected by simple CSS border lines. This
// component calling itself for node.children is what makes an
// arbitrarily deep hierarchy work without knowing its depth in advance.
function OrgNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
        {node.profilePicture ? (
          <img
            src={node.profilePicture}
            alt=""
            className="mx-auto mb-2 h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
            {node.user?.firstName?.[0]}
            {node.user?.lastName?.[0]}
          </div>
        )}
        <p className="truncate text-sm font-medium text-slate-900">
          {node.user?.firstName} {node.user?.lastName}
        </p>
        <p className="truncate text-xs text-slate-500">{node.designation}</p>
        <p className="truncate text-xs text-slate-400">{node.department}</p>

        {hasChildren && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            {expanded ? `Hide (${node.children.length})` : `Show (${node.children.length})`}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <>
          {/* The vertical connector line from this node down to its children row */}
          <div className="h-6 w-px bg-slate-300" />

          <div className="relative flex gap-8 pt-0">
            {/* The horizontal connector line spanning across all children,
                only drawn when there's more than one child - a single
                child just needs the straight vertical line above/below it. */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-slate-300"
                style={{ left: '6rem', right: '6rem' }}
              />
            )}
            {node.children.map((child) => (
              <div key={child._id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-slate-300" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}