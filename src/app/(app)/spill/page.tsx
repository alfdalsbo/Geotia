import { redirect } from "next/navigation";

export const metadata = {
  title: "Spill",
};

export default function GamesPage() {
  redirect("/spill/slowgeo");
}
