CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Seed 30 more NxtWave mock accounts
DO $seed$
DECLARE
  users JSONB := '[
    {"n":"Amit Kumar","e":"amit.kumar@nxtwave.co.in","d":"Computer Science","y":"3","g":"male","p":"+919000000106","h":"Hyderabad"},
    {"n":"Priya Singh","e":"priya.singh@nxtwave.co.in","d":"Information Technology","y":"2","g":"female","p":"+919000000107","h":"Bangalore"},
    {"n":"Arjun Rao","e":"arjun.rao@nxtwave.co.in","d":"Electronics","y":"4","g":"male","p":"+919000000108","h":"Chennai"},
    {"n":"Neha Gupta","e":"neha.gupta@nxtwave.co.in","d":"Computer Science","y":"1","g":"female","p":"+919000000109","h":"Noida"},
    {"n":"Rohan Desai","e":"rohan.desai@nxtwave.co.in","d":"Mechanical","y":"3","g":"male","p":"+919000000110","h":"Pune"},
    {"n":"Sneha Iyer","e":"sneha.iyer@nxtwave.co.in","d":"Data Science","y":"2","g":"female","p":"+919000000111","h":"Hyderabad"},
    {"n":"Vikram Patel","e":"vikram.patel@nxtwave.co.in","d":"AI/ML","y":"4","g":"male","p":"+919000000112","h":"Ahmedabad"},
    {"n":"Pooja Sharma","e":"pooja.sharma@nxtwave.co.in","d":"Civil","y":"1","g":"female","p":"+919000000113","h":"Delhi"},
    {"n":"Aditya Menon","e":"aditya.menon@nxtwave.co.in","d":"Cybersecurity","y":"3","g":"male","p":"+919000000114","h":"Kochi"},
    {"n":"Kavya Reddy","e":"kavya.reddy@nxtwave.co.in","d":"Frontend","y":"2","g":"female","p":"+919000000115","h":"Hyderabad"},
    {"n":"Karthik Nair","e":"karthik.nair@nxtwave.co.in","d":"Backend","y":"4","g":"male","p":"+919000000116","h":"Trivandrum"},
    {"n":"Shweta Joshi","e":"shweta.joshi@nxtwave.co.in","d":"Computer Science","y":"3","g":"female","p":"+919000000117","h":"Pune"},
    {"n":"Aniket Verma","e":"aniket.verma@nxtwave.co.in","d":"Information Technology","y":"1","g":"male","p":"+919000000118","h":"Lucknow"},
    {"n":"Megha Kapoor","e":"megha.kapoor@nxtwave.co.in","d":"Electronics","y":"2","g":"female","p":"+919000000119","h":"Chandigarh"},
    {"n":"Kunal Das","e":"kunal.das@nxtwave.co.in","d":"Data Science","y":"4","g":"male","p":"+919000000120","h":"Kolkata"},
    {"n":"Riya Sen","e":"riya.sen@nxtwave.co.in","d":"AI/ML","y":"3","g":"female","p":"+919000000121","h":"Kolkata"},
    {"n":"Tarun Bose","e":"tarun.bose@nxtwave.co.in","d":"Cybersecurity","y":"2","g":"male","p":"+919000000122","h":"Bhubaneswar"},
    {"n":"Nandini Roy","e":"nandini.roy@nxtwave.co.in","d":"Frontend","y":"1","g":"female","p":"+919000000123","h":"Patna"},
    {"n":"Varun Thakur","e":"varun.thakur@nxtwave.co.in","d":"Backend","y":"4","g":"male","p":"+919000000124","h":"Shimla"},
    {"n":"Yashvi Jain","e":"yashvi.jain@nxtwave.co.in","d":"Computer Science","y":"3","g":"female","p":"+919000000125","h":"Jaipur"},
    {"n":"Sameer Ali","e":"sameer.ali@nxtwave.co.in","d":"Information Technology","y":"2","g":"male","p":"+919000000126","h":"Hyderabad"},
    {"n":"Sana Khan","e":"sana.khan@nxtwave.co.in","d":"Electronics","y":"1","g":"female","p":"+919000000127","h":"Bhopal"},
    {"n":"Naveen Babu","e":"naveen.babu@nxtwave.co.in","d":"Mechanical","y":"4","g":"male","p":"+919000000128","h":"Chennai"},
    {"n":"Ayesha Siddiqui","e":"ayesha.siddiqui@nxtwave.co.in","d":"Civil","y":"3","g":"female","p":"+919000000129","h":"Lucknow"},
    {"n":"Suresh Pillai","e":"suresh.pillai@nxtwave.co.in","d":"Data Science","y":"2","g":"male","p":"+919000000130","h":"Trivandrum"},
    {"n":"Swati Mishra","e":"swati.mishra@nxtwave.co.in","d":"AI/ML","y":"1","g":"female","p":"+919000000131","h":"Indore"},
    {"n":"Akhil Chandra","e":"akhil.chandra@nxtwave.co.in","d":"Cybersecurity","y":"4","g":"male","p":"+919000000132","h":"Hyderabad"},
    {"n":"Anjali Prasad","e":"anjali.prasad@nxtwave.co.in","d":"Frontend","y":"3","g":"female","p":"+919000000133","h":"Ranchi"},
    {"n":"Mohit Agarwal","e":"mohit.agarwal@nxtwave.co.in","d":"Backend","y":"2","g":"male","p":"+919000000134","h":"Delhi"},
    {"n":"Kirti Singh","e":"kirti.singh@nxtwave.co.in","d":"Computer Science","y":"1","g":"female","p":"+919000000135","h":"Dehradun"}
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
      rec->>'e', extensions.crypt('Password123!', extensions.gen_salt('bf')),
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
