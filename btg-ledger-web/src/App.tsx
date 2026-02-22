import { useState } from 'react';
import axios from 'axios';
import { Wallet, ShieldCheck, UserPlus, LogIn, LogOut } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:5088/api/accounts';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | '2fa' | 'dashboard'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autenticação
  const [accountId, setAccountId] = useState('');
  const [token, setToken] = useState('');
  const [accountData, setAccountData] = useState<any>(null);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loginAgency, setLoginAgency] = useState('');
  const [loginNumber, setLoginNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('DEBIT');

  const handleRegister = async () => {
    try {
      setError(''); setSuccessMsg('');
      const response = await axios.post(API_URL, {
        ownerName: regName,
        initialBalance: 0,
        phoneNumber: regPhone,
        password: regPassword
      });
      
      const novaConta = response.data;
      setSuccessMsg(`Conta criada! Agência: ${novaConta.agency} | Conta: ${novaConta.number}. Guarde estes dados para o login!`);
      setCurrentScreen('login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    }
  };

  const handleLogin = async () => {
    try {
      setError(''); setSuccessMsg('');
      const response = await axios.post(`${API_URL}/login`, {
        agency: loginAgency,
        number: loginNumber,
        password: loginPassword
      });
      
      // Armazena o ID da conta na memória temporária para prosseguir com a validação 2FA
      setAccountId(response.data.accountId);
      setSuccessMsg(response.data.message);
      setCurrentScreen('2fa');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciais inválidas.');
    }
  };

  const handleValidatePin = async () => {
    try {
      setError(''); setSuccessMsg('');
      const response = await axios.post(`${API_URL}/validate-pin`, {
        accountId: accountId,
        pin: pin
      });
      
      // Autenticação bem-sucedida: Salva o JWT para as requisições autenticadas subsequentes
      setToken(response.data.token);
      await fetchAccountData(response.data.accountId);
      setCurrentScreen('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'PIN inválido.');
    }
  };

  const fetchAccountData = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      setAccountData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados da conta.');
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError('Digite um valor válido.');
      return;
    }
    try {
      setError(''); setSuccessMsg('');
      
      // Operação restrita: Requer o envio do Token JWT no Header de Autorização
      await axios.post(`${API_URL}/${accountId}/transaction`, {
        amount: Number(amount),
        type: transactionType
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      await fetchAccountData(accountId);
      setAmount('');
      setSuccessMsg('Transação realizada com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar transação.');
    }
  };

  const logout = () => {
    // Limpa todos os dados sensíveis da memória ao sair
    setToken(''); setAccountId(''); setAccountData(null);
    setLoginPassword(''); setPin('');
    setCurrentScreen('login');
    setSuccessMsg('Você saiu com segurança.');
  };

  return (
    <div className="card">
      <div className="header">
        <Wallet size={48} color="#2563eb" style={{ margin: '0 auto' }} />
        <h2>BTG Ledger System</h2>
      </div>

      {error && <div className="error">{error}</div>}
      {successMsg && <div style={{ color: '#059669', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>{successMsg}</div>}

      {currentScreen === 'login' && (
        <>
          <div className="input-group">
            <label>Agência</label>
            <input type="text" value={loginAgency} onChange={e => setLoginAgency(e.target.value)} placeholder="Ex: 0001" />
          </div>
          <div className="input-group">
            <label>Conta</label>
            <input type="text" value={loginNumber} onChange={e => setLoginNumber(e.target.value)} placeholder="Ex: 123456" />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Sua senha secreta" />
          </div>
          <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={handleLogin}>
            <LogIn size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Entrar
          </button>
          <button className="btn-success" style={{ width: '100%', backgroundColor: '#4b5563' }} onClick={() => setCurrentScreen('register')}>
            <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Criar nova conta
          </button>
        </>
      )}

      {currentScreen === 'register' && (
        <>
          <div className="input-group">
            <label>Nome Completo</label>
            <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex: Renan Lima" />
          </div>
          <div className="input-group">
            <label>Celular (Para receber o SMS de 2FA)</label>
            <input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="Ex: 21999999999" />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Crie uma senha forte" />
          </div>
          <button className="btn-success" style={{ width: '100%', marginBottom: '10px' }} onClick={handleRegister}>
            Finalizar Cadastro
          </button>
          <button className="btn-primary" style={{ width: '100%', backgroundColor: '#ef4444' }} onClick={() => setCurrentScreen('login')}>
            Voltar
          </button>
        </>
      )}

      {currentScreen === '2fa' && (
        <div style={{ textAlign: 'center' }}>
          <ShieldCheck size={40} color="#059669" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Enviamos um SMS com um código de 6 dígitos para o seu celular.
          </p>
          <div className="input-group">
            <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="Digite o PIN de 6 dígitos" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '5px' }} />
          </div>
          <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={handleValidatePin}>
            Validar PIN e Entrar
          </button>
          <button className="btn-primary" style={{ width: '100%', backgroundColor: '#ef4444' }} onClick={() => setCurrentScreen('login')}>
            Cancelar
          </button>
        </div>
      )}

      {currentScreen === 'dashboard' && accountData && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>Olá, {accountData.ownerName}</p>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, width: 'auto' }}>
              <LogOut size={20} />
            </button>
          </div>
          
          <div style={{ textAlign: 'center', margin: '1rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Agência: {accountData.agency} | Conta: {accountData.number}</p>
            <div className="balance" style={{ color: accountData.balance >= 0 ? '#059669' : '#dc2626' }}>
              R$ {accountData.balance.toFixed(2)}
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Saldo Atual</p>
          </div>

          <div className="input-group">
            <label>Valor da Transação (R$)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="input-group">
            <label>Tipo de Operação</label>
            <select value={transactionType} onChange={e => setTransactionType(e.target.value)}>
              <option value="DEBIT">Saque / Débito</option>
              <option value="CREDIT">Depósito / Crédito</option>
              <option value="REFUND">Estorno</option>
            </select>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleTransaction}>
            Confirmar Transação
          </button>
        </>
      )}
    </div>
  );
}

export default App;