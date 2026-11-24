
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. College domain lookup table
CREATE TABLE public.college_domains (
  domain TEXT PRIMARY KEY,
  college TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.college_domains TO anon, authenticated;
GRANT ALL ON public.college_domains TO service_role;
ALTER TABLE public.college_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "College domains are public" ON public.college_domains FOR SELECT USING (true);

INSERT INTO public.college_domains (domain, college) VALUES
('vit.ac.in','VIT Vellore'),('vitstudent.ac.in','VIT Vellore'),('vitap.ac.in','VIT-AP'),('vitapstudent.ac.in','VIT-AP'),('vitbhopal.ac.in','VIT Bhopal'),
('srmist.edu.in','SRM IST'),('srmap.edu.in','SRM AP'),('annauniv.edu','Anna University'),
('iitm.ac.in','IIT Madras'),('iitb.ac.in','IIT Bombay'),('iitd.ac.in','IIT Delhi'),('iitk.ac.in','IIT Kanpur'),('iitkgp.ac.in','IIT Kharagpur'),('iitg.ac.in','IIT Guwahati'),('iitr.ac.in','IIT Roorkee'),('iith.ac.in','IIT Hyderabad'),('iitbbs.ac.in','IIT Bhubaneswar'),('iitj.ac.in','IIT Jodhpur'),('iitmandi.ac.in','IIT Mandi'),('iitgn.ac.in','IIT Gandhinagar'),
('iiit.ac.in','IIIT Hyderabad'),('iiitb.ac.in','IIIT Bangalore'),('iiitd.ac.in','IIIT Delhi'),('iiitl.ac.in','IIIT Lucknow'),('iiitdm.ac.in','IIITDM'),('iiitkottayam.ac.in','IIIT Kottayam'),('iiitnr.edu.in','IIIT Naya Raipur'),('iiita.ac.in','IIIT Allahabad'),
('iisc.ac.in','IISc Bangalore'),
('ssn.edu.in','SSN College'),('svce.ac.in','SVCE Chennai'),('rajalakshmi.edu.in','Rajalakshmi'),('sathyabama.ac.in','Sathyabama'),('hindustanuniv.ac.in','Hindustan University'),('saveetha.ac.in','Saveetha'),('veltech.edu.in','Vel Tech'),('crescent.education','Crescent'),('stjosephstechnology.ac.in','St Josephs'),('jeppiaarcollege.org','Jeppiaar'),('panimalar.ac.in','Panimalar'),('sairam.edu.in','Sairam'),('sairamit.edu.in','Sairam IT'),
('loyolacollege.edu','Loyola College'),('mcc.edu.in','MCC'),('dgvaishnavcollege.edu.in','DG Vaishnav'),('ethirajcollege.edu.in','Ethiraj'),('wcc.edu.in','WCC'),('madrasuniversity.ac.in','Madras University'),
('rvce.edu.in','RVCE'),('bmsce.ac.in','BMSCE'),('bmsit.in','BMSIT'),('msrit.edu','MSRIT'),('pes.edu','PES University'),('christuniversity.in','Christ University'),('reva.edu.in','REVA'),('cmrit.ac.in','CMRIT'),('nmit.ac.in','NMIT'),('newhorizonindia.edu','New Horizon'),('jainuniversity.ac.in','Jain University'),('alliance.edu.in','Alliance'),('presidencyuniversity.in','Presidency'),('acsce.edu.in','ACSCE'),('dayanandasagar.edu','Dayananda Sagar'),
('uohyd.ac.in','University of Hyderabad'),('osmania.ac.in','Osmania University'),('jntuh.ac.in','JNTU Hyderabad'),('cbit.ac.in','CBIT'),('griet.ac.in','GRIET'),('cvr.ac.in','CVR'),('vnrvjiet.in','VNR VJIET'),('mgit.ac.in','MGIT'),('mahindrauniversity.edu.in','Mahindra University'),('anurag.edu.in','Anurag University'),('mlrinstitutions.ac.in','MLR Institutions'),('woxsen.edu.in','Woxsen'),('ifheindia.org','IFHE'),
('kluniversity.in','KL University'),('vignan.ac.in','Vignan'),('gitam.edu','GITAM'),('rgukt.in','RGUKT'),('srkr.edu.in','SRKR'),('aditya.ac.in','Aditya'),('aec.edu.in','AEC'),('pvpsiddhartha.ac.in','PVP Siddhartha'),('rvrjc.ac.in','RVR & JC'),('vrsiddhartha.ac.in','VR Siddhartha'),('svuniversity.edu.in','SV University'),('jntuku.edu.in','JNTU Kakinada'),('andhrauniversity.edu.in','Andhra University'),('nist.edu','NIST'),
('bits-pilani.ac.in','BITS Pilani'),('manipal.edu','Manipal'),('amity.edu','Amity University'),('amity.edu.in','Amity University'),('dtu.ac.in','DTU'),
('nitt.edu','NIT Trichy'),('nitk.edu.in','NIT Karnataka'),('nitw.ac.in','NIT Warangal'),('nitc.ac.in','NIT Calicut'),('nitrkl.ac.in','NIT Rourkela'),('mnit.ac.in','MNIT Jaipur'),
('jadavpuruniversity.in','Jadavpur University'),('kiit.ac.in','KIIT'),('soa.ac.in','SOA University'),('thapar.edu','Thapar'),('chitkara.edu.in','Chitkara'),('lnmiit.ac.in','LNMIIT'),('sharda.ac.in','Sharda'),('galgotiasuniversity.edu.in','Galgotias'),('lpu.in','LPU'),('cuonline.ac.in','Chandigarh University'),('symbiosis.ac.in','Symbiosis'),('mitwpu.edu.in','MIT WPU'),('coep.org.in','COEP'),('pccoepune.com','PCCOE');

-- 2. Update handle_new_user to use the lookup table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain TEXT;
  _college TEXT;
BEGIN
  _domain := lower(split_part(NEW.email, '@', 2));
  SELECT college INTO _college FROM public.college_domains WHERE domain = _domain;
  IF _college IS NULL THEN
    RAISE EXCEPTION 'Email domain % is not from a supported college. Contact support to add your institution.', _domain;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, college, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    _college,
    (NEW.email_confirmed_at IS NOT NULL)
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- 3. Seed 50 dummy verified users
DO $seed$
DECLARE
  users JSONB := '[
    {"n":"Aarav Sharma","e":"aarav.sharma2023@vitap.ac.in","d":"CSE","y":"3","g":"male","p":"+919000000001","h":"Hostel A"},
    {"n":"Diya Patel","e":"diya.patel2022@vit.ac.in","d":"ECE","y":"4","g":"female","p":"+919000000002","h":"Ladies Hostel"},
    {"n":"Rohan Iyer","e":"rohan.iyer@iitm.ac.in","d":"Mechanical","y":"2","g":"male","p":"+919000000003","h":"Ganga Hostel"},
    {"n":"Ananya Reddy","e":"ananya.reddy@srmap.edu.in","d":"CSE","y":"1","g":"female","p":"+919000000004","h":"Block C"},
    {"n":"Kabir Singh","e":"kabir.singh@iitb.ac.in","d":"EE","y":"3","g":"male","p":"+919000000005","h":"H4"},
    {"n":"Isha Verma","e":"isha.verma@iitd.ac.in","d":"CSE","y":"2","g":"female","p":"+919000000006","h":"Kailash"},
    {"n":"Aditya Rao","e":"aditya.rao@bits-pilani.ac.in","d":"IT","y":"4","g":"male","p":"+919000000007","h":"Ram Bhavan"},
    {"n":"Meera Nair","e":"meera.nair@nitt.edu","d":"Chemical","y":"3","g":"female","p":"+919000000008","h":"Opal"},
    {"n":"Arjun Menon","e":"arjun.menon@nitc.ac.in","d":"CSE","y":"2","g":"male","p":"+919000000009","h":"Mega A"},
    {"n":"Sara Khan","e":"sara.khan@manipal.edu","d":"Biotech","y":"1","g":"female","p":"+919000000010","h":"18th Block"},
    {"n":"Vikram Joshi","e":"vikram.joshi@iitk.ac.in","d":"Aerospace","y":"3","g":"male","p":"+919000000011","h":"Hall 5"},
    {"n":"Nisha Gupta","e":"nisha.gupta@iiitd.ac.in","d":"CSAM","y":"2","g":"female","p":"+919000000012","h":"Girls Hostel"},
    {"n":"Rahul Das","e":"rahul.das@iitkgp.ac.in","d":"Civil","y":"4","g":"male","p":"+919000000013","h":"RK Hall"},
    {"n":"Priya Kumari","e":"priya.kumari@iith.ac.in","d":"MSE","y":"2","g":"female","p":"+919000000014","h":"Girls Block"},
    {"n":"Karan Malhotra","e":"karan.malhotra@dtu.ac.in","d":"ME","y":"3","g":"male","p":"+919000000015","h":"Aryabhatta"},
    {"n":"Tanvi Shah","e":"tanvi.shah@christuniversity.in","d":"BBA","y":"2","g":"female","p":"+919000000016","h":"Kengeri"},
    {"n":"Aryan Kapoor","e":"aryan.kapoor@pes.edu","d":"CSE","y":"3","g":"male","p":"+919000000017","h":"BSK"},
    {"n":"Neha Bansal","e":"neha.bansal@thapar.edu","d":"ECE","y":"4","g":"female","p":"+919000000018","h":"GH-A"},
    {"n":"Siddharth Mishra","e":"siddharth.mishra@kiit.ac.in","d":"CSE","y":"2","g":"male","p":"+919000000019","h":"KP-7"},
    {"n":"Pooja Yadav","e":"pooja.yadav@lpu.in","d":"Agriculture","y":"1","g":"female","p":"+919000000020","h":"BH-2"},
    {"n":"Manish Chauhan","e":"manish.chauhan@amity.edu","d":"BCA","y":"2","g":"male","p":"+919000000021","h":"Amity Hostel"},
    {"n":"Ritika Jain","e":"ritika.jain@symbiosis.ac.in","d":"Law","y":"3","g":"female","p":"+919000000022","h":"Pune Campus"},
    {"n":"Harsh Vardhan","e":"harsh.vardhan@iiitb.ac.in","d":"CSE","y":"4","g":"male","p":"+919000000023","h":"Boys Hostel"},
    {"n":"Sneha Pillai","e":"sneha.pillai@ssn.edu.in","d":"IT","y":"2","g":"female","p":"+919000000024","h":"Ladies A"},
    {"n":"Yash Agarwal","e":"yash.agarwal@vitbhopal.ac.in","d":"CSE","y":"1","g":"male","p":"+919000000025","h":"Boys 1"},
    {"n":"Divya Menon","e":"divya.menon@rvce.edu.in","d":"ISE","y":"3","g":"female","p":"+919000000026","h":"RV Girls"},
    {"n":"Aakash Pandey","e":"aakash.pandey@bmsce.ac.in","d":"ECE","y":"2","g":"male","p":"+919000000027","h":"BMS Boys"},
    {"n":"Simran Kaur","e":"simran.kaur@chitkara.edu.in","d":"CSE","y":"4","g":"female","p":"+919000000028","h":"Chitkara GH"},
    {"n":"Rajat Bhatia","e":"rajat.bhatia@galgotiasuniversity.edu.in","d":"MBA","y":"2","g":"male","p":"+919000000029","h":"Galgotias BH"},
    {"n":"Kavya Sinha","e":"kavya.sinha@sharda.ac.in","d":"Dentistry","y":"3","g":"female","p":"+919000000030","h":"Sharda GH"},
    {"n":"Ishaan Roy","e":"ishaan.roy@jadavpuruniversity.in","d":"Physics","y":"4","g":"male","p":"+919000000031","h":"JU Boys"},
    {"n":"Aditi Chatterjee","e":"aditi.chatterjee@soa.ac.in","d":"CSE","y":"1","g":"female","p":"+919000000032","h":"SOA GH"},
    {"n":"Nikhil Prasad","e":"nikhil.prasad@nitk.edu.in","d":"CSE","y":"3","g":"male","p":"+919000000033","h":"MB1"},
    {"n":"Riya Deshmukh","e":"riya.deshmukh@coep.org.in","d":"ME","y":"2","g":"female","p":"+919000000034","h":"COEP LH"},
    {"n":"Suraj Naidu","e":"suraj.naidu@gitam.edu","d":"CSE","y":"4","g":"male","p":"+919000000035","h":"GITAM BH"},
    {"n":"Payal Trivedi","e":"payal.trivedi@srmist.edu.in","d":"Biotech","y":"3","g":"female","p":"+919000000036","h":"Java GH"},
    {"n":"Devansh Mehta","e":"devansh.mehta@nitw.ac.in","d":"EEE","y":"2","g":"male","p":"+919000000037","h":"Ultimatum"},
    {"n":"Alisha Fernandes","e":"alisha.fernandes@mitwpu.edu.in","d":"Design","y":"1","g":"female","p":"+919000000038","h":"MIT GH"},
    {"n":"Rohit Saxena","e":"rohit.saxena@iiit.ac.in","d":"CSE","y":"4","g":"male","p":"+919000000039","h":"Bakul"},
    {"n":"Shreya Kulkarni","e":"shreya.kulkarni@kluniversity.in","d":"CSE","y":"2","g":"female","p":"+919000000040","h":"KLU GH"},
    {"n":"Aman Tripathi","e":"aman.tripathi@iiita.ac.in","d":"IT","y":"3","g":"male","p":"+919000000041","h":"BH-2"},
    {"n":"Muskan Arora","e":"muskan.arora@iitr.ac.in","d":"Chemical","y":"2","g":"female","p":"+919000000042","h":"Sarojini"},
    {"n":"Varun Shetty","e":"varun.shetty@msrit.edu","d":"AI-ML","y":"4","g":"male","p":"+919000000043","h":"MSRIT BH"},
    {"n":"Bhavya Rao","e":"bhavya.rao@uohyd.ac.in","d":"MSc CS","y":"1","g":"female","p":"+919000000044","h":"UoH GH"},
    {"n":"Tarun Mehra","e":"tarun.mehra@iitg.ac.in","d":"CSE","y":"3","g":"male","p":"+919000000045","h":"Kameng"},
    {"n":"Anjali Suresh","e":"anjali.suresh@mcc.edu.in","d":"BCom","y":"2","g":"female","p":"+919000000046","h":"Day Scholar"},
    {"n":"Pranav Krishnan","e":"pranav.krishnan@svce.ac.in","d":"Mechatronics","y":"3","g":"male","p":"+919000000047","h":"SVCE BH"},
    {"n":"Zoya Ahmed","e":"zoya.ahmed@jainuniversity.ac.in","d":"Psychology","y":"1","g":"female","p":"+919000000048","h":"Jain GH"},
    {"n":"Kunal Bose","e":"kunal.bose@iisc.ac.in","d":"Research","y":"4","g":"male","p":"+919000000049","h":"IISc Q"},
    {"n":"Lakshmi Iyengar","e":"lakshmi.iyengar@bmsit.in","d":"ISE","y":"2","g":"female","p":"+919000000050","h":"BMSIT GH"}
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
      jsonb_build_object('full_name', rec->>'n'),
      now(), now(), '', '', '', ''
    );
    UPDATE public.profiles SET
      department = rec->>'d', year = rec->>'y', gender = (rec->>'g')::gender_type,
      phone = rec->>'p', hostel = rec->>'h',
      bio = 'Student at ' || (SELECT college FROM public.college_domains WHERE domain = lower(split_part(rec->>'e','@',2)))
    WHERE id = new_id;
  END LOOP;
END $seed$;
