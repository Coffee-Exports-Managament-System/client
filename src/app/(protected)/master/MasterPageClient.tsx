"use client";

import { ResourcePanel } from "@/components/data/ResourcePanel";
import { ModuleWorkspace } from "@/components/layout/ModuleWorkspace";
import { masterPanels } from "@/modules/master/config";
import { MasterRowActions } from "@/modules/master/MasterRowActions";

type Props = {
  canManage: boolean;
};

export function MasterPageClient({ canManage }: Props): React.JSX.Element {
  return (
    <ModuleWorkspace
      title="Master Data Workspace"
      subtitle="Set up one reference dataset at a time."
      sections={masterPanels.map((panel) => ({
        id: panel.title.toLowerCase().replace(/\s+/g, "-"),
        label: panel.title,
        hint: panel.description,
        content: (
          <ResourcePanel
            title={panel.title}
            description={panel.description}
            listEndpoint={panel.listEndpoint}
            createEndpoint={panel.createEndpoint}
            createFields={panel.createFields}
            sortBy={panel.sortBy}
            filters={panel.filters}
            rowActionsLabel={canManage ? "Actions" : undefined}
            rowActions={
              canManage
                ? (row) => (
                    <MasterRowActions
                      row={row}
                      listEndpoint={panel.listEndpoint}
                      title={panel.title}
                      fields={panel.createFields}
                      rowFieldMap={panel.rowFieldMap}
                    />
                  )
                : undefined
            }
          />
        )
      }))}
    />
  );
}
