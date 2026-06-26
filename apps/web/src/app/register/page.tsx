import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { requireSessionUser } from '../../lib/session';

type RegisterPageProps = {
  searchParams: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

async function registerCustomer(formData: FormData) {
  'use server';

  await api.completeCustomerOnboarding({
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? '') || undefined,
    phone: String(formData.get('phone') ?? '') || undefined
  });

  redirect('/motorcycles');
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await requireSessionUser(['CUSTOMER']);
  if (user.customerProfileId) {
    redirect('/motorcycles');
  }

  return (
    <main className="page form-page">
      <section className="form-shell">
        <p className="eyebrow">Step 1</p>
        <h1>Complete customer profile</h1>
        <p className="lede">Create your MotoTrust customer profile before adding motorcycle details.</p>

        <form action={registerCustomer} className="flow-form">
          <label>
            Full name
            <input
              name="fullName"
              placeholder="Hruday Vishal Banda"
              required
              minLength={2}
              maxLength={120}
              defaultValue={searchParams.fullName ?? user.displayName ?? ''}
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="hruday@example.com"
              defaultValue={searchParams.email ?? user.email ?? ''}
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              type="tel"
              placeholder="+919876543210"
              defaultValue={searchParams.phone ?? user.phone ?? ''}
            />
          </label>

          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}
