from manim import *
import json

class GitHubSolarSystem(Scene):
    def construct(self):
        self.camera.background_color = "#0d1117"
        self.camera.frame_width = 16
        self.camera.frame_height = 9
        
        # Load data from file
        try:
            with open('stats_data.json') as f:
                data = json.load(f)
        except:
            data = {
                "username": "test",
                "name": "Test User",
                "bio": "Developer",
                "languages": [
                    {"name": "JavaScript", "percent": 40, "color": "#f7df1e"},
                    {"name": "TypeScript", "percent": 30, "color": "#3178c6"},
                ]
            }
        
        self.play_terminal(data["username"], data["name"], data["bio"])
        self.play_solar_system(data["languages"])
        
    def play_terminal(self, username, name, bio):
        terminal = RoundedRectangle(
            height=5, width=7,
            corner_radius=0.15,
            fill_color="#161b22",
            fill_opacity=0.95,
            stroke_color="#00ff41",
            stroke_opacity=0.3
        )
        
        dots = VGroup(*[
            Dot(color=c, radius=0.08).shift(UP * 2.1 + LEFT * 3 + RIGHT * i * 0.25)
            for i, c in enumerate(["#ff5f56", "#ffbd2e", "#27c93f"])
        ])
        
        prompt = Text(f"{username}@github ~ %", font="Monospace", font_size=20, color="#8b949e")
        prompt.shift(UP * 1.6 + LEFT * 2.8)
        
        self.play(FadeIn(terminal), FadeIn(dots), run_time=0.5)
        self.play(Write(prompt), run_time=0.3)
        
        whoami = Text("whoami", font="Monospace", font_size=20, color="#00ff41")
        whoami.next_to(prompt, RIGHT)
        self.play(AddTextLetterByLetter(whoami), run_time=0.6)
        self.wait(0.2)
        
        flash = Rectangle(height=0.4, width=6.5, fill_color="#00ff41", fill_opacity=0.2)
        flash.shift(UP * 1.6)
        self.play(FadeIn(flash), run_time=0.1)
        self.play(FadeOut(flash), run_time=0.1)
        
        output = VGroup(
            Text(name, font="Monospace", font_size=24, color="#00ff41"),
            Text(bio, font="Monospace", font_size=18, color="#8b949e")
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        output.shift(UP * 0.8 + LEFT * 2.8)
        
        self.play(Write(output), run_time=0.8)
        self.wait(1)
        self.play(FadeOut(VGroup(terminal, dots, prompt, whoami, output)))
        
    def play_solar_system(self, languages):
        sun = Circle(radius=0.8, fill_color="#ffaa00", fill_opacity=1)
        sun.set_stroke("#ff8800", width=2)
        
        glows = VGroup(*[
            Circle(radius=0.9 + i*0.3, stroke_color="#ffaa00", stroke_opacity=0.15/i)
            for i in range(1, 4)
        ])
        
        self.play(FadeIn(sun), FadeIn(glows), run_time=0.8)
        
        planets = []
        for i, lang in enumerate(languages[:6]):
            angle = i * TAU / len(languages)
            distance = 2.5 + i * 0.8
            
            orbit = Circle(radius=distance, stroke_color="#00ff41", stroke_opacity=0.1)
            self.play(Create(orbit), run_time=0.3)
            
            size = 0.2 + lang["percent"] / 200
            planet = Circle(radius=size, fill_color=lang["color"], fill_opacity=1)
            planet.set_stroke("#ffffff", width=1, opacity=0.5)
            
            pos = [distance * np.cos(angle), distance * np.sin(angle), 0]
            planet.move_to(pos)
            
            label = Text(
                f"{lang['name']}\n{lang['percent']}%",
                font="Monospace",
                font_size=14,
                color="white"
            )
            label.next_to(planet, DOWN, buff=0.1)
            
            planets.append({
                "obj": planet,
                "label": label,
                "distance": distance,
                "speed": 0.3 + i * 0.1,
                "angle": angle
            })
            
            self.play(FadeIn(planet), FadeIn(label), run_time=0.4)
        
        self.wait(0.5)
        
        def update_planets(mob, alpha):
            for p in planets:
                new_angle = p["angle"] + alpha * TAU * p["speed"]
                x = p["distance"] * np.cos(new_angle)
                y = p["distance"] * np.sin(new_angle)
                p["obj"].move_to([x, y, 0])
                p["label"].move_to([x, y - 0.5, 0])
        
        self.play(
            UpdateFromAlphaFunc(VGroup(), update_planets),
            run_time=8,
            rate_func=linear
        )
        
        self.wait(1)