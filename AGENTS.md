<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Canvas AI context selection is project-wide and sends complete files with a full path manifest; checkboxes prioritize rather than restrict edits, avoiding incomplete coordinated changes.
- Canvas AI generation and gateway helpers live in server-only modules, loaded inside the server function handler, to keep credentials and model calls out of the browser.
- Validate a proposal as a complete set before previewing it; reject ambiguous paths and overwrites of unread files to protect project contents.
