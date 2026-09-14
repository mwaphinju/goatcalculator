/**
 * Renders one JSON-LD `<script>` tag, server-rendered into the static
 * export's HTML. `data` must already be a plain, JSON-serializable object
 * built from real, visible page content — never fabricated fields.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
