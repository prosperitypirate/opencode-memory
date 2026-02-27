import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "codexfi",
    },
    links: [
      {
        text: "GitHub",
        url: "https://github.com/prosperitypirate/codexfi",
        external: true,
      },
    ],
  };
}
