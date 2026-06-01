fn reverse_string(s: &str) -> String {
    s.chars().rev().collect()
}

fn main() {
    let text = "CrossLanguage";
    let reversed = reverse_string(text);

    println!("{}", reversed);
}