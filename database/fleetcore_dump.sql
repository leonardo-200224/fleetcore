--
-- PostgreSQL database dump
--

\restrict Yb5eyqCVRBpf9jNJfUxCg2sUFcHsLjeoi7SRFpoVU1CNyUVrLj5vURQWkxWGvBf

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
    finished_at timestamp with time zone,
    final_mileage integer,
    "vehicleId" uuid NOT NULL,
    "mechanicId" uuid NOT NULL,
    "workshopId" uuid NOT NULL,
    final_cost integer
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

COPY public.maintenances (id, created_at, updated_at, deleted_at, type, description, mileage, scheduled_start, scheduled_end, status, work_done, finished_at, final_mileage, "vehicleId", "mechanicId", "workshopId", final_cost) FROM stdin;
65c4b833-a1a4-43bb-b458-31d93cc36c86	2026-10-30 00:19:48.619628+00	2026-10-30 00:19:48.619628+00	\N	PREVENTIVE	Cambio de aceite y filtros	45000	2026-09-15 14:00:00+00	2026-09-15 16:30:00+00	COMPLETED	Se cambio el aceite del motor y los dos filtros	2026-09-15 16:30:00+00	45200	f11f053b-d9c9-4b51-94b1-26df0d4fdb9e	1381f3fa-11ef-4c9b-8e4b-a1cd882d966d	14ef1cba-c5a9-4e62-a215-03a9ea5bd058	350000
c043a936-882c-43b9-9a53-502a435726b2	2026-10-30 00:19:48.623704+00	2026-10-30 00:19:48.623704+00	\N	CORRECTIVE	Reparacion de la caja de cambios	78000	2026-11-10 13:00:00+00	2026-11-10 18:00:00+00	IN_PROGRESS	\N	\N	\N	95f20c27-93a9-4f6a-bbd9-488f5cb45d8a	8cd1b337-bceb-40fb-b6a5-bde6d58679bc	14ef1cba-c5a9-4e62-a215-03a9ea5bd058	\N
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechanics (id, created_at, updated_at, deleted_at, name, email, specialty, status, user_id) FROM stdin;
8cd1b337-bceb-40fb-b6a5-bde6d58679bc	2026-10-30 00:19:48.596137+00	2026-10-30 00:19:48.596137+00	\N	Juan Perez	juan.perez@fleetcore.com	Motor	ACTIVE	54b8a9d8-a913-4d97-b9ca-2b9bc7fa8e58
1381f3fa-11ef-4c9b-8e4b-a1cd882d966d	2026-10-30 00:19:48.599786+00	2026-10-30 00:19:48.599786+00	\N	Laura Gomez	laura.gomez@fleetcore.com	Frenos	ACTIVE	06bddead-cbed-4f75-b600-afa00c49d994
c5e1c4ad-1322-4468-b75b-da1732a7abc0	2026-10-30 00:19:48.602297+00	2026-10-30 00:19:48.602297+00	\N	Carlos Ruiz	carlos.ruiz@fleetcore.com	Electricidad	INACTIVE	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, created_at, updated_at, deleted_at, name, email, password, role) FROM stdin;
b1f5e91d-ef18-4711-9f77-65cee12d0194	2026-10-30 00:19:48.462248+00	2026-10-30 00:19:48.462248+00	\N	Administrador FleetCore	admin@fleetcore.com	$2b$10$BvEK08acVe07tzRnSVW2V.xoUEDVuWe0b2Bk7jwdFsp.o2R5BIYSq	ADMIN
54b8a9d8-a913-4d97-b9ca-2b9bc7fa8e58	2026-10-30 00:19:48.527911+00	2026-10-30 00:19:48.527911+00	\N	Juan Perez	juan.perez@fleetcore.com	$2b$10$3kyHAY1DBn4UDPvExIq6R.X8S6CK7I4rgN9AU8lkcU3d91DYQuC/a	TECHNICIAN
06bddead-cbed-4f75-b600-afa00c49d994	2026-10-30 00:19:48.589595+00	2026-10-30 00:19:48.589595+00	\N	Laura Gomez	laura.gomez@fleetcore.com	$2b$10$UB/JCPyO5YNfm4WgCgpafe7MXLXExwGO82Fm1zrfdcWsBflfdiD9W	TECHNICIAN
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, created_at, updated_at, deleted_at, plate, brand, model, year, mileage, status) FROM stdin;
f11f053b-d9c9-4b51-94b1-26df0d4fdb9e	2026-10-30 00:19:48.60946+00	2026-10-30 00:19:48.60946+00	\N	ABC123	Chevrolet	NPR	2020	45200	AVAILABLE
caf17bca-b9cc-4c4e-afdc-fa24db5b16f5	2026-10-30 00:19:48.611925+00	2026-10-30 00:19:48.611925+00	\N	DEF456	Hino	300	2021	23000	AVAILABLE
95f20c27-93a9-4f6a-bbd9-488f5cb45d8a	2026-10-30 00:19:48.613957+00	2026-10-30 00:19:48.613957+00	\N	GHI789	Isuzu	ELF	2019	78000	IN_MAINTENANCE
d64a7c2f-53d2-430c-9ed1-d89931c643c5	2026-10-30 00:19:48.61582+00	2026-10-30 00:19:48.61582+00	\N	JKL012	Kia	K2700	2016	150000	INACTIVE
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workshops (id, created_at, updated_at, deleted_at, name, address, status) FROM stdin;
14ef1cba-c5a9-4e62-a215-03a9ea5bd058	2026-10-30 00:19:48.604918+00	2026-10-30 00:19:48.604918+00	\N	Taller Norte	Calle 80 # 45-12, Medellin	ACTIVE
184605aa-430a-4d32-b0e4-e271957127bf	2026-10-30 00:19:48.6069+00	2026-10-30 00:19:48.6069+00	\N	Taller Centro	Carrera 50 # 10-20, Medellin	INACTIVE
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

\unrestrict Yb5eyqCVRBpf9jNJfUxCg2sUFcHsLjeoi7SRFpoVU1CNyUVrLj5vURQWkxWGvBf

