-- Seed NxtWave mock accounts
DO $seed$
DECLARE
  users JSONB := '[
    {"n":"Sai Teja","e":"sai.teja@nxtwave.co.in","d":"Fullstack","y":"1","g":"male","p":"+919000000101","h":"Hyderabad"},
    {"n":"Anusha G","e":"anusha.g@nxtwave.co.in","d":"Frontend","y":"2","g":"female","p":"+919000000102","h":"Bangalore"},
    {"n":"Rahul Verma","e":"rahul.verma@nxtwave.co.in","d":"Backend","y":"1","g":"male","p":"+919000000103","h":"Noida"},
    {"n":"Divya K","e":"divya.k@nxtwave.co.in","d":"Data Science","y":"2","g":"female","p":"+919000000104","h":"Chennai"},
    {"n":"Siddharth R","e":"siddharth.r@nxtwave.co.in","d":"Cybersecurity","y":"3","g":"male","p":"+919000000105","h":"Hyderabad"}
  ]'::jsonb;
  rec JSONB;
  new_id UUID;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(users) LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = rec->>'e') THEN CONTINUE; END IF;
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      rec->>'e', crypt('Password123!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec->>'n', 'college', 'NxtWave'),
      now(), now(), '', '', '', ''
    );
    
    UPDATE public.profiles SET
      department = rec->>'d', year = rec->>'y', gender = (rec->>'g')::gender_type,
      phone = rec->>'p', hostel = rec->>'h',
      bio = 'Student at NxtWave'
    WHERE id = new_id;
  END LOOP;
END $seed$;
