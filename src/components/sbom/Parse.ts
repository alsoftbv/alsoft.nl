export interface Component {
  name: string;
  version?: string;
  licenses: string[];
  supplier?: string;
  purl?: string;
  type?: string;
}

export interface Sbom {
  format: string;
  name?: string;
  components: Component[];
}

type Json = Record<string, any>;

const SPDX_EMPTY = new Set(["NOASSERTION", "NONE", ""]);

function cleanSpdx(value: unknown): string | undefined {
  return typeof value === "string" && !SPDX_EMPTY.has(value)
    ? value
    : undefined;
}

function cycloneLicenses(component: Json): string[] {
  const entries: Json[] = Array.isArray(component.licenses)
    ? component.licenses
    : [];

  return entries
    .map(
      (entry) =>
        entry.expression ?? entry.license?.id ?? entry.license?.name ?? ""
    )
    .filter(Boolean);
}

function parseCycloneDx(doc: Json): Sbom {
  const components: Component[] = [];

  // Components can nest (assemblies), so flatten the tree
  const visit = (list: Json[] | undefined) => {
    for (const c of list ?? []) {
      components.push({
        name: c.group ? `${c.group}/${c.name}` : c.name ?? "?",
        version: c.version || undefined,
        licenses: cycloneLicenses(c),
        supplier: c.supplier?.name ?? c.publisher ?? c.author ?? undefined,
        purl: c.purl || undefined,
        type: c.type,
      });
      visit(c.components);
    }
  };
  visit(doc.components);

  return {
    format: `CycloneDX ${doc.specVersion ?? ""}`.trim(),
    name: doc.metadata?.component?.name,
    components,
  };
}

function parseSpdx(doc: Json): Sbom {
  const packages: Json[] = Array.isArray(doc.packages) ? doc.packages : [];
  const described = new Set<string>(doc.documentDescribes ?? []);

  const components = packages
    .filter((p) => !described.has(p.SPDXID) || packages.length === 1)
    .map((p) => {
      const license =
        cleanSpdx(p.licenseConcluded) ?? cleanSpdx(p.licenseDeclared);
      const purl = (p.externalRefs ?? []).find(
        (ref: Json) => ref.referenceType === "purl"
      )?.referenceLocator;

      return {
        name: p.name ?? "?",
        version: cleanSpdx(p.versionInfo),
        licenses: license ? [license] : [],
        supplier: cleanSpdx(p.supplier)?.replace(/^(Organization|Person):\s*/, ""),
        purl,
        type: p.primaryPackagePurpose?.toLowerCase(),
      };
    });

  return {
    format: doc.spdxVersion ?? "SPDX",
    name: doc.name,
    components,
  };
}

export function parseSbom(text: string): Sbom | "parse" | "format" {
  let doc: Json;
  try {
    doc = JSON.parse(text);
  } catch {
    return "parse";
  }

  if (doc?.bomFormat === "CycloneDX") {
    return parseCycloneDx(doc);
  }
  if (typeof doc?.spdxVersion === "string") {
    return parseSpdx(doc);
  }
  return "format";
}

export const exampleSbom = JSON.stringify(
  {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    metadata: {
      component: { type: "firmware", name: "sensor-node", version: "2.4.0" },
    },
    components: [
      {
        type: "operating-system",
        name: "FreeRTOS-Kernel",
        version: "11.1.0",
        supplier: { name: "Amazon Web Services" },
        licenses: [{ license: { id: "MIT" } }],
        purl: "pkg:github/FreeRTOS/FreeRTOS-Kernel@V11.1.0",
      },
      {
        type: "library",
        name: "lwip",
        version: "2.2.0",
        supplier: { name: "lwIP developers" },
        licenses: [{ license: { id: "BSD-3-Clause" } }],
        purl: "pkg:generic/lwip@2.2.0",
      },
      {
        type: "library",
        name: "mbedtls",
        version: "3.6.2",
        supplier: { name: "Mbed TLS" },
        licenses: [{ expression: "Apache-2.0 OR GPL-2.0-or-later" }],
        purl: "pkg:github/Mbed-TLS/mbedtls@v3.6.2",
      },
      {
        type: "library",
        name: "coreMQTT",
        version: "2.3.1",
        licenses: [{ license: { id: "MIT" } }],
        purl: "pkg:github/FreeRTOS/coreMQTT@v2.3.1",
      },
      {
        type: "library",
        name: "vendor-hal",
        version: "1.8.0",
        supplier: { name: "Chip Vendor" },
        licenses: [{ license: { id: "BSD-3-Clause" } }],
      },
      {
        type: "library",
        name: "cjson",
        licenses: [{ license: { id: "MIT" } }],
      },
      {
        type: "library",
        name: "board-support",
        version: "0.3.0",
      },
    ],
  },
  null,
  2
);
