#include <iostream>
#include <string>

std::string reverse_string(std::string s) {
    int len = s.length();
    for (int i = 0; i < len / 2; i++) {
        char temp = s[i];
        s[i] = s[len - i - 1];
        s[len - i - 1] = temp;
    }
    return s;
}

int main() {
    std::cout << reverse_string("hello") << std::endl;
    return 0;
}
