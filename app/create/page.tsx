import Navbar from "@/components/Navbar";
import CreateBookForm from "./CreateBookForm";
import { ui } from "@/lib/ui";

export default function CreatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1
            className={`text-4xl font-bold ${ui.text} mb-2`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Create a Book
          </h1>
          <p className={ui.textMuted}>
            Fill in the details and upload your chapters as{" "}
            <code className={`text-xs ${ui.inlineBg} px-1.5 py-0.5 rounded`}>.md</code> or{" "}
            <code className={`text-xs ${ui.inlineBg} px-1.5 py-0.5 rounded`}>.mdx</code> files.
          </p>
        </div>
        <CreateBookForm />
      </main>
    </div>
  );
}
