import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { AppShell } from '../../components/app-shell';
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
    <AppShell
      role="CUSTOMER"
      currentPath="/register"
      eyebrow="Step 1"
      title="Complete customer profile"
      description="Set up your MotoTrust account so bookings, approvals, and service history stay connected to one rider profile."
    >
      <section className="form-shell">
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
    </AppShell>
  );
}
