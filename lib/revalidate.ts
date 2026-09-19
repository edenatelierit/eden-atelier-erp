import { revalidatePath } from "next/cache";

export function revalidateWorkspace() {
  revalidatePath("/", "layout");
}