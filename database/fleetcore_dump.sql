--
-- PostgreSQL database dump
--

\restrict Ocqc5Q0iiGLIINUfecXHiGwZHyXLZjmKQm79Zhf1wzoLKSGOf3cm63gwG8ce5u6

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_daa193fdfccde41a2ed4de8a474";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_75331cd2a0f0c22bcb2fc4f6d6a";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "FK_4e69c5d1d5ef843a571535ccfde";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_3a9ba7c05e1ffba00560d11f364";
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS "UQ_ec7181ebdab798d97070122a5bf";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "UQ_301c3b5fa2d49aab65dcfda36a6";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "REL_4e69c5d1d5ef843a571535ccfd";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "PK_a3ffb1c0c8416b9fc6f907b7433";
ALTER TABLE IF EXISTS ONLY public.workshops DROP CONSTRAINT IF EXISTS "PK_6d0e82a124f5b53df91c8989848";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "PK_62403473bd524a42d58589aa78b";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "PK_2c0ed23afc0cc7ff361c17e53df";
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS "PK_18d8646b59304dce4af3a9e35b6";
DROP TABLE IF EXISTS public.workshops;
DROP TABLE IF EXISTS public.vehicles;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.mechanics;
DROP TABLE IF EXISTS public.maintenances;
DROP TYPE IF EXISTS public.workshops_status_enum;
DROP TYPE IF EXISTS public.vehicles_status_enum;
DROP TYPE IF EXISTS public.users_role_enum;
DROP TYPE IF EXISTS public.mechanics_status_enum;
DROP TYPE IF EXISTS public.maintenances_type_enum;
DROP TYPE IF EXISTS public.maintenances_status_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: maintenances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


--
-- Name: mechanics_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mechanics_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


--
-- Name: workshops_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workshops_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    type public.maintenances_type_enum NOT NULL,
    description text NOT NULL,
    mileage integer NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    status public.maintenances_status_enum DEFAULT 'SCHEDULED'::public.maintenances_status_enum NOT NULL,
    work_done text,
    final_cost integer,
    finished_at timestamp with time zone,
    final_mileage integer,
    "vehicleId" uuid NOT NULL,
    "mechanicId" uuid NOT NULL,
    "workshopId" uuid NOT NULL
);


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    specialty character varying(100) NOT NULL,
    status public.mechanics_status_enum DEFAULT 'ACTIVE'::public.mechanics_status_enum NOT NULL,
    user_id uuid
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    plate character varying(10) NOT NULL,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    year integer NOT NULL,
    mileage integer DEFAULT 0 NOT NULL,
    status public.vehicles_status_enum DEFAULT 'AVAILABLE'::public.vehicles_status_enum NOT NULL
);


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    address character varying(150) NOT NULL,
    status public.workshops_status_enum DEFAULT 'ACTIVE'::public.workshops_status_enum NOT NULL
);


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenances (id, created_at, updated_at, deleted_at, type, description, mileage, scheduled_start, scheduled_end, status, work_done, final_cost, finished_at, final_mileage, "vehicleId", "mechanicId", "workshopId") FROM stdin;
9b779170-73fe-4abf-8bb4-2903855825b9	2026-10-30 01:21:08.990902+00	2026-10-30 01:21:08.990902+00	\N	PREVENTIVE	Cambio de aceite y filtros	45000	2026-09-15 14:00:00+00	2026-09-15 16:30:00+00	COMPLETED	Se cambio el aceite del motor y los dos filtros	350000	2026-09-15 16:30:00+00	45200	009d731b-da14-4153-bae9-5eb2816d7e07	32770291-6fff-471f-af47-b1b4417a9d36	f1e6299e-5e40-490c-aec2-e7130eafe078
914a2b63-90a6-4f99-acbb-c2c02f47b3f9	2026-10-30 01:21:08.995669+00	2026-10-30 01:21:08.995669+00	\N	CORRECTIVE	Reparacion de la caja de cambios	78000	2026-11-10 13:00:00+00	2026-11-10 18:00:00+00	IN_PROGRESS	\N	\N	\N	\N	35b5ec7c-17a0-4101-aad6-0bddbc550916	08d8caec-6648-40c1-a963-de1fc90bd229	f1e6299e-5e40-490c-aec2-e7130eafe078
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechanics (id, created_at, updated_at, deleted_at, name, email, specialty, status, user_id) FROM stdin;
08d8caec-6648-40c1-a963-de1fc90bd229	2026-10-30 01:21:08.967004+00	2026-10-30 01:21:08.967004+00	\N	Juan Perez	juan.perez@fleetcore.com	Motor	ACTIVE	ddd98d29-e9cd-4fbc-904b-eb887fbec69a
32770291-6fff-471f-af47-b1b4417a9d36	2026-10-30 01:21:08.970771+00	2026-10-30 01:21:08.970771+00	\N	Laura Gomez	laura.gomez@fleetcore.com	Frenos	ACTIVE	14a17679-5a49-4f6b-a0a0-eb8e44d9fce1
cfa26692-614c-4fab-9576-ec377de4cb17	2026-10-30 01:21:08.973092+00	2026-10-30 01:21:08.973092+00	\N	Carlos Ruiz	carlos.ruiz@fleetcore.com	Electricidad	INACTIVE	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, created_at, updated_at, deleted_at, name, email, password, role) FROM stdin;
36d6474a-e73a-4fff-9efa-8c5e40e71db7	2026-10-30 01:21:08.833454+00	2026-10-30 01:21:08.833454+00	\N	Administrador FleetCore	admin@fleetcore.com	$2b$10$TFYYUVfNEIMEb0VAhE4XMupETgkbUl5F3Bn5lQMhQX5WJJJpiWGbi	ADMIN
ddd98d29-e9cd-4fbc-904b-eb887fbec69a	2026-10-30 01:21:08.898553+00	2026-10-30 01:21:08.898553+00	\N	Juan Perez	juan.perez@fleetcore.com	$2b$10$xtRj3lh9kcJh20tr.6/hVOlVZOZ.k6oKhFvoQ7htBXplpGngIl5wi	TECHNICIAN
14a17679-5a49-4f6b-a0a0-eb8e44d9fce1	2026-10-30 01:21:08.960753+00	2026-10-30 01:21:08.960753+00	\N	Laura Gomez	laura.gomez@fleetcore.com	$2b$10$4KNwIB4pS.VL43/h8SnEwel3L2gRjA4.xKvlcdePjbDNCvG0fr0Hu	TECHNICIAN
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, created_at, updated_at, deleted_at, plate, brand, model, year, mileage, status) FROM stdin;
009d731b-da14-4153-bae9-5eb2816d7e07	2026-10-30 01:21:08.980395+00	2026-10-30 01:21:08.980395+00	\N	ABC123	Chevrolet	NPR	2020	45200	AVAILABLE
c7719120-7e99-4a00-b42a-97423460a7bf	2026-10-30 01:21:08.983019+00	2026-10-30 01:21:08.983019+00	\N	DEF456	Hino	300	2021	23000	AVAILABLE
35b5ec7c-17a0-4101-aad6-0bddbc550916	2026-10-30 01:21:08.98522+00	2026-10-30 01:21:08.98522+00	\N	GHI789	Isuzu	ELF	2019	78000	IN_MAINTENANCE
d2612377-70c1-427f-8263-a135ff891030	2026-10-30 01:21:08.987304+00	2026-10-30 01:21:08.987304+00	\N	JKL012	Kia	K2700	2016	150000	INACTIVE
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workshops (id, created_at, updated_at, deleted_at, name, address, status) FROM stdin;
f1e6299e-5e40-490c-aec2-e7130eafe078	2026-10-30 01:21:08.975644+00	2026-10-30 01:21:08.975644+00	\N	Taller Norte	Calle 80 # 45-12, Medellin	ACTIVE
1aec0064-176c-4495-973b-17c37bcb41a9	2026-10-30 01:21:08.977824+00	2026-10-30 01:21:08.977824+00	\N	Taller Centro	Carrera 50 # 10-20, Medellin	INACTIVE
\.


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: mechanics REL_4e69c5d1d5ef843a571535ccfd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "REL_4e69c5d1d5ef843a571535ccfd" UNIQUE (user_id);


--
-- Name: mechanics UQ_301c3b5fa2d49aab65dcfda36a6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_301c3b5fa2d49aab65dcfda36a6" UNIQUE (email);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.mechanics(id);


--
-- Name: mechanics FK_4e69c5d1d5ef843a571535ccfde; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_4e69c5d1d5ef843a571535ccfde" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id);


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Ocqc5Q0iiGLIINUfecXHiGwZHyXLZjmKQm79Zhf1wzoLKSGOf3cm63gwG8ce5u6

