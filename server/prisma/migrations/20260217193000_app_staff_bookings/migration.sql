-- App-level tables used by the current Turnapp API for staff and bookings.
CREATE TABLE "AppStaff" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "availability" TEXT,
  "avatar" TEXT,
  "workSchedule" JSONB NOT NULL,
  "slotDurationMinutes" INTEGER NOT NULL DEFAULT 45,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppStaff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppBooking" (
  "id" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "clientName" TEXT NOT NULL,
  "contact" TEXT,
  "serviceId" TEXT,
  "service" TEXT NOT NULL,
  "serviceCategory" TEXT,
  "stylist" TEXT NOT NULL,
  "stylistId" TEXT NOT NULL,
  "paymentMethod" TEXT,
  "paymentStatus" TEXT,
  "paymentId" TEXT,
  "paymentApprovedAt" TEXT,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppBooking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppBooking_date_idx" ON "AppBooking"("date");
CREATE INDEX "AppBooking_stylistId_date_idx" ON "AppBooking"("stylistId", "date");

ALTER TABLE "AppBooking"
  ADD CONSTRAINT "AppBooking_stylistId_fkey"
  FOREIGN KEY ("stylistId") REFERENCES "AppStaff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
