import Grid from "@/components/layout/Grid";
import { TypographyH2 } from "@/components/atoms/typoqraphy";

export function RelatedTemplates() {
  // const filtered = relatedTemplates.filter((t) => t.id !== currentTemplateId);

  return (
    <div>
      <TypographyH2 className="text-foreground mb-6 border-none text-3xl font-bold">비슷한 템플릿</TypographyH2>
      <Grid slot="related-templates">
        {/* {filtered.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))} */}
      </Grid>
    </div>
  );
}
