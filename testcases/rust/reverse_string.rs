fn reverse_string(s: &str) -> String {
    let mut chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    let mut i = 0;
    while i < len / 2 {
        let temp = chars[i];
        chars[i] = chars[len - i - 1];
        chars[len - i - 1] = temp;
        i += 1;
    }
    chars.into_iter().collect()
}

fn main() {
    println!("{}", reverse_string("hello"));
}
