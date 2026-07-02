import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { submitPasswordReset } from '@/store/useAuthStore';
import resetImage from './animated/assets/login.svg';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMissingToken = !token.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (isMissingToken) {
      setError('Şifre sıfırlama bağlantısı eksik veya hatalı.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      setNotice(await submitPasswordReset(token, newPassword));
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Şifre güncellenemedi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="password-reset">
      <section className="password-reset__visual" aria-hidden="true">
        <div className="password-reset__brand">Maintly</div>
        <img src={resetImage} alt="" />
      </section>

      <section className="password-reset__panel">
        <div className="password-reset__card">
          <div className="password-reset__icon">
            {notice ? <CheckCircle2 size={24} /> : <LockKeyhole size={24} />}
          </div>
          <h1>Şifreni Yenile</h1>
          <p>Hesabına yeni bir şifre belirle.</p>

          {notice ? (
            <div className="password-reset__success">
              <p>{notice}</p>
              <div className="password-reset__actions">
                <button type="button" onClick={() => navigate('/customer/login')}>
                  <span>Fabrika/İşletme Girişi</span>
                  <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => navigate('/service/login')}>
                  <span>Servis Girişi</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                <span>Yeni şifre</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isMissingToken}
                  required
                />
              </label>
              <label>
                <span>Yeni şifre tekrar</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isMissingToken}
                  required
                />
              </label>

              {error && <p className="password-reset__error">{error}</p>}

              <button className="password-reset__submit" type="submit" disabled={isSubmitting || isMissingToken}>
                <span>{isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <Link className="password-reset__back-link" to="/customer/login">
            Giriş ekranına dön
          </Link>
        </div>
      </section>
    </main>
  );
}
