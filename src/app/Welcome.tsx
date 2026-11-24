import { Link } from 'react-router-dom';
import { P } from './paths';
import { Button, Icon, PetArt } from '@/design/ui';
import './welcome.css';

export function Welcome() {
  return (
    <div className="welcome">
      <header className="welcome-header">
        <div className="welcome-container">
          <Link className="welcome-brand" to={P.home}>
            <img src="/icon.svg" alt="" width="34" height="34" />
            새록
          </Link>
          <nav aria-label="서비스 메뉴">
            <a href="#how-it-works">이용 방법</a>
            <Link to={P.help}>도움</Link>
          </nav>
        </div>
      </header>
      <main className="welcome-container welcome-main" id="main-content">
        <section className="welcome-hero" aria-labelledby="welcome-title">
          <div className="welcome-intro">
            <h1 id="welcome-title">기억하는 방법을 배우고 내 생활에 써 봐요</h1>
            <p className="sub">장 볼 물건과 약속을 떠올리는 연습을 해요. 기억 친구 몽글과 내 속도로 시작할 수 있어요.</p>
            <div className="welcome-actions">
              <Button to={P.fontSize}>기억 연습 시작하기</Button>
              <Button variant="secondary" to={P.tourHome}>예제 둘러보기</Button>
            </div>
          </div>
          <figure className="welcome-art">
            <PetArt size={320} />
            <figcaption>기억 친구 몽글</figcaption>
          </figure>
        </section>
        <section className="welcome-guide" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="title">새록 이용 방법</h2>
          <ol className="welcome-steps">
            <li><Icon name="book" /><h3>기억 방법 배우기</h3><p>묶기, 시각화, 의미 연결처럼 생활에서 써 볼 방법을 익혀요.</p></li>
            <li><Icon name="grid" /><h3>짧게 연습하기</h3><p>순서대로 고르고 조금 뒤에 떠올리는 연습을 해요.</p></li>
            <li><Icon name="calendar" /><h3>생활에 써 보기</h3><p>내 목표를 정하고 이번 주에 실천한 내용을 돌아봐요.</p></li>
          </ol>
          <p className="small">연습 기록은 이 브라우저에 저장돼요. 새록은 기억 연습을 돕는 서비스예요.</p>
        </section>
      </main>
    </div>
  );
}
