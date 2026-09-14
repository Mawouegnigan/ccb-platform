import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-parchment">
      <p className="text-sm tracking-wide text-navy/60 mb-3">
        Coordination des Cours Bibliques
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-navy font-semibold max-w-2xl leading-tight">
        Registre des moniteurs et assistants
      </h1>
      <p className="mt-4 max-w-md text-ink/70">
        Inscrivez-vous, ou connectez-vous si vous gérez déjà une région ou
        une sous-région.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/inscription"
          className="px-6 py-3 rounded bg-navy text-white font-medium hover:bg-navy-light transition-colors"
        >
          S&apos;inscrire
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded border border-navy/20 text-navy font-medium hover:border-navy/40 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
