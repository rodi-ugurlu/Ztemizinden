import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Activity, Fingerprint, Lock, ShieldCheck, Database } from 'lucide-react';

/**
 * AdminLogin Component
 *
 * Temizinden OPS MERKEZİ - Administrative Access Portal
 * Dark theme with indigo accents for system administrators.
 */

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { loginWithCredentials, isLoading, error, setError } = useAuthStore();

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);
    setStep(2); // Move to 2FA step
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (token.length !== 6) {
      setLocalError('Güvenlik kodu 6 haneli olmalıdır.');
      return;
    }

    try {
      await loginWithCredentials('admin', email, password);
    } catch {
      // Go back to credentials step on failure so they can re-enter
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-300 font-sans">
      
      {/* Background Tech Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        {/* Fake grid/data lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        
        {/* Left Side - Info Panel */}
        <div className="lg:col-span-2 hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">OPS CENTER</h2>
              <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase">System Control</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 backdrop-blur-sm shadow-xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Security Status
            </h3>
            <div className="space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>Encryption</span>
                <span className="text-emerald-500">AES-256 Active</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>Network</span>
                <span className="text-emerald-500">Secure/Private</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Access Logs</span>
                <span className="text-blue-400">Monitoring</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 backdrop-blur-sm shadow-xl">
             <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> System Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono"><span>Cluster Alpha</span> <span className="text-slate-300">98%</span></div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[98%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono"><span>API Gateway</span> <span className="text-slate-300">42ms</span></div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[20%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:col-span-3 flex justify-center">
          <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl rounded-xl">
            <CardHeader className="space-y-1 pt-8 px-8">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 border border-slate-700">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-semibold text-white tracking-tight">Administrative Access</CardTitle>
              <CardDescription className="text-slate-400">
                Authenticate to access the operations center.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {step === 1 ? (
                <form onSubmit={handleCredentials} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Corporate Email
                    </label>
                    <Input 
                      type="email" 
                      required 
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 h-11"
                      placeholder="admin@corp.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <Input 
                      type="password" 
                      required 
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 mt-4" disabled={isLoading}>
                    {isLoading ? 'Checking...' : 'Verify Credentials'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handle2FA} className="space-y-5">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-lg">
                    <Fingerprint className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-400">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Security Token
                    </label>
                    <Input 
                      type="text" 
                      required 
                      maxLength={6}
                      className="bg-slate-950 border-slate-800 text-center text-2xl tracking-[0.5em] text-slate-100 focus-visible:ring-indigo-500 h-14 font-mono"
                      placeholder="••••••"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setStep(1)} disabled={isLoading}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white h-11" disabled={isLoading}>
                      {isLoading ? 'Authorizing...' : 'Authorize'}
                    </Button>
                  </div>
                </form>
              )}
              
              {(localError || error) && (
                <div className="mt-5 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs text-center">
                  {localError ?? error}
                </div>
              )}
            </CardContent>
            <CardFooter className="px-8 pb-8 pt-0 border-t border-slate-800/50 mt-4 flex justify-between items-center text-xs text-slate-500">
              <span>Restricted System.</span>
              <a href="#" className="hover:text-slate-300 transition-colors">IT Support</a>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
