const supabase = require('../config/supabaseClient');

exports.register = async (req, res) => {
  const { fullName, companyName, email, mobileNumber, password } = req.body;

  if (!fullName || !companyName || !email || !mobileNumber || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase.from('profiles').select('email').eq('email', email).single();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    // 2. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: 'Email already registered. Please login.' });
      }
      throw authError;
    }

    if (!authData.user) {
      return res.status(400).json({ message: 'Registration failed.' });
    }

    // 3. Create profile record
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        full_name: fullName,
        company_name: companyName,
        email,
        mobile_number: mobileNumber
      }
    ]);

    if (profileError) throw profileError;

    res.status(201).json({ message: 'Registration Successful. Please login.' });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('invalid login credentials')) {
        // Distinguish between wrong password and not found
        const { data: profile } = await supabase.from('profiles').select('email').eq('email', email).single();
        if (!profile) {
          return res.status(400).json({ message: 'Account not found. Please register first.' });
        } else {
          return res.status(400).json({ message: 'Incorrect password.' });
        }
      }
      throw authError;
    }

    // 2. Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    res.json({
      token: authData.session.access_token,
      user: {
        id: profileData.id,
        fullName: profileData.full_name,
        email: profileData.email,
        companyName: profileData.company_name,
        mobileNumber: profileData.mobile_number,
        createdAt: profileData.created_at
      },
      message: 'Login Successful.'
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).send('Server Error');
  }
};
