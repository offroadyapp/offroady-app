import PageShell from '@/app/components/PageShell';
import AuthPanel from '@/app/components/AuthPanel';

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Forgot password</p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">Send me a secure reset link</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
              Enter the email tied to your Offroady account. If it exists, we will send you a time-limited password reset link.
            </p>
          </section>
          <AuthPanel initialMode="reset" />

          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[#243126]">Troubleshooting</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
              <li>Check your <strong>Spam</strong>, <strong>Promotions</strong>, or <strong>Updates</strong> folder.</li>
              <li>Add <strong>noreply@notify.offroady.app</strong> to your contacts to ensure delivery.</li>
              <li>The reset link expires in 1 hour. Request a new one if the link has expired.</li>
              <li>Make sure you're using the email address associated with your Offroady account.</li>
            </ul>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
